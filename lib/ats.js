import { unstable_cache } from 'next/cache';
import { asHTML } from '@prismicio/client';
import { parseJobLocation, formatLocations, resolveCountryAlias } from './location';
import { getCareersPostsList, getCareersPostByUID } from './prismic';

// Manually-posted jobs (authored in Prismic as `careers_post` documents) are
// usually postings Fox and Lion is running on behalf of another company, so
// each one gets its own companySlug derived from `company_name` rather than
// being lumped into one shared bucket — that's what lets the Company filter
// on /careers show "Anduril" and "Some Client Co" as separate options
// instead of merging every manual posting under "Fox and Lion".
//
// getJobDetail() doesn't need this slug to actually locate the document
// (Prismic UIDs are unique on their own — see the fallback branch below),
// it only needs to not collide with a real COMPANIES slug, since that's
// checked first. slugifyCompanyName appends "-partner" in the rare case a
// manual posting's company name would otherwise slugify to exactly
// "anduril"/"palantir"/"helsing".
function slugifyCompanyName(name) {
  const base =
    (name || 'company')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'company';
  return getCompanyBySlug(base) ? `${base}-partner` : base;
}

// Live job listings pulled directly from each company's public ATS API —
// no scraping. The raw bulk-list responses are too large for Next's own
// fetch cache (Anduril's alone is ~2.3MB, Palantir's Lever list ~7.6MB
// with descriptions baked in — over the 2MB per-item cache limit either
// way), so instead we cache the small *normalized* result of `getAllJobs`
// itself via `unstable_cache` — see bottom of this file. That result is a
// few hundred KB at most, comfortably cacheable, and is what actually
// governs how often /careers and the homepage re-hit the origin APIs.
//
// Important: the list-fetching `fetchJson` calls below must NOT use
// `cache: 'no-store'` — a no-store fetch inside `unstable_cache` throws
// `DYNAMIC_SERVER_USAGE` during static generation (this bit us: the error
// was swallowed by `Promise.allSettled`, silently baking an empty jobs
// array into the static build). Leave them at default fetch caching;
// Next's own cache will just no-op on these (too big to store), which is
// fine since `unstable_cache` is what actually governs freshness here.
//
// Rebellion Defence is deliberately excluded: their Greenhouse board
// (`rebelliondefense`) resolves and returns valid JSON but with zero open
// roles, and their marketing site has no careers link at all right now.
// Re-add them if they start posting again.
//
// Shield AI is deliberately excluded for now too: they only publish
// through Ashby (their Lever listing is a stale mirror), and Ashby's
// public API has no single-job endpoint — hitting one 401s. Re-add once
// there's a plan for Shield AI job-detail pages that doesn't require
// re-pulling the entire 8MB board on every job view.
export const COMPANIES = [
  { name: 'Anduril Industries', slug: 'anduril', platform: 'greenhouse', token: 'andurilindustries', domain: 'anduril.com' },
  { name: 'Palantir Technologies', slug: 'palantir', platform: 'lever', token: 'palantir', domain: 'palantir.com' },
  { name: 'Helsing', slug: 'helsing', platform: 'greenhouse', token: 'helsing', domain: 'helsing.ai' },
];

export function getCompanyBySlug(slug) {
  return COMPANIES.find((c) => c.slug === slug) || null;
}

const ROLE_RULES = [
  ['Engineering', /engineer|firmware|software|hardware|full.?stack|backend|frontend|embedded|infrastructure|devops|site reliability|avionics|robotics|autonomy|electrical|mechanical|aerospace/i],
  ['Research', /research|scientist|applied science/i],
  ['Product', /product manager|product management|\bproduct\b/i],
  ['Design', /\bdesign(er)?\b|\bux\b|\bui\b/i],
  ['Program & Operations', /program manager|project manager|operations|supply chain|logistics|quality assurance|facilities|manufactur/i],
  ['People & Talent', /recruit|talent|human resources|\bhr\b|people (team|operations)/i],
  ['Sales & Business Development', /sales|business development|\bbd\b|partnerships|customer success|account (manager|executive)|growth marketing|marketing/i],
  ['Finance & Accounting', /finance|accounting|accounts (payable|receivable)|treasury|\btax\b|fp&a|payroll/i],
  ['Legal & Policy', /legal|policy|compliance|contracts?|counsel|government affairs|regulatory/i],
  ['Administrative', /administrative|executive assistant|office manager/i],
];

function classifyRoleType(text) {
  const t = (text || '').toLowerCase();
  for (const [label, pattern] of ROLE_RULES) {
    if (pattern.test(t)) return label;
  }
  return 'Other';
}

function formatEmploymentType(raw) {
  if (!raw) return null;
  return raw.replace(/([a-z])([A-Z])/g, '$1 $2');
}

// Greenhouse's `content` field is HTML-entity-encoded within the JSON
// string itself (literal "&lt;div&gt;", not "<div>") — decode before
// handing it to dangerouslySetInnerHTML. Lever's description fields are
// already raw HTML and don't need this.
const NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  mdash: '—', ndash: '–', hellip: '…',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
  copy: '©', reg: '®', trade: '™',
};

function decodeHtmlEntities(str) {
  if (!str) return str;
  return str.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity) => {
    if (entity[0] === '#') {
      const code =
        entity[1] === 'x' || entity[1] === 'X'
          ? parseInt(entity.slice(2), 16)
          : parseInt(entity.slice(1), 10);
      return Number.isNaN(code) ? match : String.fromCodePoint(code);
    }
    return NAMED_ENTITIES[entity] ?? match;
  });
}

// `content=true` is deliberately omitted here: it adds each job's full
// HTML description, which blows Anduril's payload up from ~2MB to ~49MB
// for data the list view never displays.
async function fetchJson(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`${url} responded ${res.status}`);
  return res.json();
}

async function fetchGreenhouseJobs(company) {
  const data = await fetchJson(`https://boards-api.greenhouse.io/v1/boards/${company.token}/jobs`);
  return (data.jobs || []).map((job) => {
    const departmentMeta = job.metadata?.find(
      (m) => m.name === 'External Department Name for Job Board'
    );
    const department = departmentMeta?.value || null;
    const employmentTypeMeta = job.metadata?.find((m) => m.name === 'Employment Type');
    const { workplaceType, locations } = parseJobLocation(job.location?.name, {
      context: `${company.name} #${job.id}`,
    });
    return {
      id: `gh-${company.slug}-${job.id}`,
      platformId: String(job.id),
      title: job.title,
      company: company.name,
      companySlug: company.slug,
      companyDomain: company.domain,
      location: formatLocations(locations, workplaceType),
      locations,
      workplaceType,
      department,
      roleType: classifyRoleType(`${department || ''} ${job.title}`),
      employmentType: employmentTypeMeta?.value || null,
      postedAt: job.first_published || job.updated_at || null,
      featured: false,
    };
  });
}

async function fetchLeverJobs(company) {
  const data = await fetchJson(`https://api.lever.co/v0/postings/${company.token}?mode=json`);
  return (data || []).map((job) => {
    const { workplaceType, locations } = parseJobLocation(job.categories?.location, {
      context: `${company.name} #${job.id}`,
      structuredWorkplaceType: job.workplaceType,
      structuredCountry: resolveCountryAlias(job.country),
    });
    return {
      id: `lever-${company.slug}-${job.id}`,
      platformId: job.id,
      title: job.text,
      company: company.name,
      companySlug: company.slug,
      companyDomain: company.domain,
      location: formatLocations(locations, workplaceType),
      locations,
      workplaceType,
      department: job.categories?.team || null,
      roleType: classifyRoleType(`${job.categories?.team || ''} ${job.text}`),
      employmentType: job.categories?.commitment || null,
      postedAt: job.createdAt ? new Date(job.createdAt).toISOString() : null,
      featured: false,
    };
  });
}

// Editors pick workplaceType/roleType explicitly from Select fields (see
// customtypes/job_posting/index.json) rather than having them guessed from
// free text, since a manual posting's title/department don't reliably imply
// either the way an ATS listing's do. `location` free text still gets run
// through the same parser ATS jobs use, purely so it can populate the
// Country filter in JobsBoard — workplaceType itself always defers to the
// explicit field.
function normalizeManualJob(doc) {
  const { workplaceType: parsedWorkplaceType, locations } = parseJobLocation(doc.data.location, {
    context: `manual job ${doc.uid}`,
  });
  const workplaceType = doc.data.workplace_type || parsedWorkplaceType;
  const company = doc.data.company_name || 'Fox and Lion';
  return {
    id: `manual-${doc.uid}`,
    platformId: doc.uid,
    title: doc.data.title,
    company,
    companySlug: slugifyCompanyName(company),
    companyDomain: null,
    location: doc.data.location || (workplaceType === 'Remote' ? 'Remote' : null),
    locations,
    workplaceType,
    department: doc.data.department || null,
    roleType: doc.data.role_type || 'Other',
    employmentType: doc.data.employment_type || null,
    postedAt: doc.data.posted_at || doc.first_publication_date,
    featured: !!doc.data.featured,
  };
}

async function fetchManualJobsUncached() {
  try {
    const docs = await getCareersPostsList();
    return docs.map(normalizeManualJob);
  } catch (err) {
    console.warn('Manual job fetch failed:', err);
    return [];
  }
}

const FETCHERS = {
  greenhouse: fetchGreenhouseJobs,
  lever: fetchLeverJobs,
};

async function fetchAllJobsUncached() {
  const [atsResults, manualJobs] = await Promise.all([
    Promise.allSettled(COMPANIES.map((company) => FETCHERS[company.platform](company))),
    fetchManualJobsUncached(),
  ]);

  atsResults.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.warn(`ATS fetch failed for ${COMPANIES[index].name}:`, result.reason);
    }
  });

  const atsJobs = atsResults.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
  const jobs = [...manualJobs, ...atsJobs];
  jobs.sort((a, b) => (b.postedAt || '').localeCompare(a.postedAt || ''));
  return jobs;
}

// The normalized list (a few hundred KB) is what's actually cached — an
// hour between origin refetches. Both /careers and the homepage call this,
// so this is the one place that governs how often Greenhouse/Lever get
// hit, regardless of how many pages read the result. The `tags` entry lets
// the Prismic revalidate webhook (app/api/revalidate/route.js) bust this
// specific cache entry the moment a job_posting is published, instead of
// manual jobs waiting up to an hour to appear — revalidatePath alone
// wouldn't reliably invalidate an unstable_cache entry, only revalidateTag
// does.
export const getAllJobs = unstable_cache(fetchAllJobsUncached, ['fox-and-lion-all-jobs'], {
  revalidate: 3600,
  tags: ['fox-and-lion-jobs'],
});

// Single-job detail fetches. Both platforms' single-posting endpoints
// return one job (~10-15KB), well under Next's 2MB data-cache limit, so
// these are cached via the page's `revalidate` — unlike the bulk list.

async function fetchGreenhouseJobDetail(company, platformId) {
  const job = await fetchJson(
    `https://boards-api.greenhouse.io/v1/boards/${company.token}/jobs/${platformId}?content=true`,
    { next: { revalidate: 3600 } }
  );
  const department = job.departments?.[0]?.name || null;
  const employmentTypeMeta = job.metadata?.find((m) => m.name === 'Employment Type');
  const { workplaceType, locations } = parseJobLocation(job.location?.name, {
    context: `${company.name} #${platformId}`,
  });
  return {
    title: job.title,
    company: company.name,
    companySlug: company.slug,
    companyDomain: company.domain,
    location: formatLocations(locations, workplaceType),
    workplaceType,
    department,
    roleType: classifyRoleType(`${department || ''} ${job.title}`),
    employmentType: employmentTypeMeta?.value || null,
    applyUrl: job.absolute_url,
    descriptionHtml: decodeHtmlEntities(job.content) || '',
    postedAt: job.first_published || job.updated_at || null,
  };
}

async function fetchLeverJobDetail(company, platformId) {
  const job = await fetchJson(
    `https://api.lever.co/v0/postings/${company.token}/${platformId}?mode=json`,
    { next: { revalidate: 3600 } }
  );
  const sections = (job.lists || [])
    .map((section) => `<h3>${section.text}</h3>${section.content || ''}`)
    .join('');
  const descriptionHtml = `${job.description || ''}${sections}${job.closing || ''}`;
  const { workplaceType, locations } = parseJobLocation(job.categories?.location, {
    context: `${company.name} #${platformId}`,
    structuredWorkplaceType: job.workplaceType,
    structuredCountry: resolveCountryAlias(job.country),
  });
  return {
    title: job.text,
    company: company.name,
    companySlug: company.slug,
    companyDomain: company.domain,
    location: formatLocations(locations, workplaceType),
    workplaceType,
    department: job.categories?.team || null,
    roleType: classifyRoleType(`${job.categories?.team || ''} ${job.text}`),
    employmentType: job.categories?.commitment || null,
    applyUrl: job.applyUrl || job.hostedUrl,
    descriptionHtml,
    postedAt: job.createdAt ? new Date(job.createdAt).toISOString() : null,
  };
}

const DETAIL_FETCHERS = {
  greenhouse: fetchGreenhouseJobDetail,
  lever: fetchLeverJobDetail,
};

// Mirrors lib/richTextComponents.js's sharedRichTextComponents (used by
// <PrismicRichText> on the News/Analysis detail pages) as an HTML map
// serializer instead of React components, since the job detail page
// renders descriptionHtml via dangerouslySetInnerHTML rather than
// <PrismicRichText> — so a careers_post using the same heading5-as-divider
// / heading6-as-caption convention still renders consistently here.
const CAREERS_POST_HTML_SERIALIZER = {
  heading5: () => '<hr class="article-body__divider" />',
  heading6: ({ children }) => `<p class="article-body__caption">${children}</p>`,
};

async function getManualJobDetail(uid) {
  const doc = await getCareersPostByUID(uid);
  if (!doc) return null;
  const job = normalizeManualJob(doc);
  return {
    title: job.title,
    company: job.company,
    companySlug: job.companySlug,
    companyDomain: job.companyDomain,
    location: job.location,
    workplaceType: job.workplaceType,
    department: job.department,
    roleType: job.roleType,
    employmentType: job.employmentType,
    applyUrl: doc.data.apply_url?.url || null,
    descriptionHtml: asHTML(doc.data.description, { serializer: CAREERS_POST_HTML_SERIALIZER }) || '',
    postedAt: job.postedAt,
  };
}

export async function getJobDetail(companySlug, platformId) {
  const company = getCompanyBySlug(companySlug);
  if (company) {
    try {
      return await DETAIL_FETCHERS[company.platform](company, platformId);
    } catch (err) {
      console.warn(`Job detail fetch failed for ${companySlug}/${platformId}:`, err);
      return null;
    }
  }

  // Not a known ATS company slug — assume a manually-posted job. platformId
  // (the Prismic UID) is unique on its own, so this doesn't need companySlug
  // to disambiguate; it's only present in the URL for a readable path.
  try {
    return await getManualJobDetail(platformId);
  } catch (err) {
    console.warn(`Manual job detail fetch failed for ${platformId}:`, err);
    return null;
  }
}
