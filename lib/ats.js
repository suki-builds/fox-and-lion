import { asHTML } from '@prismicio/client';
import { parseJobLocation, formatLocations, resolveCountryAlias } from './location';
import { getCareersPostsList, getCareersPostByUID } from './prismic';
import { createPublicClient } from './supabase/public';

// Manually-posted jobs (authored in Prismic as `careers_post` documents) are
// usually postings Fox and Lion is running on behalf of another company, so
// each one gets its own companySlug derived from `company_name` rather than
// being lumped into one shared bucket — that's what lets the Company filter
// on /careers show "Helsing" and "Some Client Co" as separate options
// instead of merging every manual posting under "Fox and Lion".
//
// getJobDetail() doesn't need this slug to actually locate the document
// (Prismic UIDs are unique on their own — see the fallback branch below),
// it only needs to not collide with a real COMPANIES slug, since that's
// checked first. slugifyCompanyName appends "-partner" in the rare case a
// manual posting's company name would otherwise slugify to exactly one of
// the ATS company slugs below.
function slugifyCompanyName(name) {
  const base =
    (name || 'company')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'company';
  return getCompanyBySlug(base) ? `${base}-partner` : base;
}

// Live job listings pulled directly from each company's public ATS API — no
// scraping. As of the ats_jobs Supabase table, these APIs are only ever hit
// by the cron-triggered sync route (app/api/sync-jobs/route.js), never by a
// page request — see that file and getAllJobs()/getJobDetail() below.
//
// `region: 'eu'` (Lever only) means the company's board is hosted on
// Lever's EU data-residency instance, which answers on a different API
// host entirely (api.eu.lever.co, 404s on the global host) rather than
// just a different path — confirmed by testing each token directly.
// Greenhouse has no equivalent split: despite EU-hosted companies' public
// career *site* living on job-boards.eu.greenhouse.io, their Job Board API
// data is still served from the one global boards-api.greenhouse.io host
// (also confirmed by testing — boards-api.eu.greenhouse.io doesn't resolve
// at all), so no region field is needed for Greenhouse entries.
//
// Anduril and Palantir are deliberately excluded by request - not a data
// or platform issue, just not wanted on this board.
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
  { name: 'Helsing', slug: 'helsing', platform: 'greenhouse', token: 'helsing', domain: 'helsing.ai' },

  // Added from the europe_defence_database_v10.xlsx research pass (see
  // careers_feed_ats_research.md) — all confirmed Greenhouse/Lever boards,
  // same integration pattern as Helsing above.
  { name: 'Occam Industries', slug: 'occam-industries', platform: 'greenhouse', token: 'occamindustries', domain: 'occam-group.co.uk' },
  { name: 'Alpine Eagle', slug: 'alpine-eagle', platform: 'greenhouse', token: 'alpineeagle', domain: 'alpineeagle.com' },
  { name: 'ARX Robotics', slug: 'arx-robotics', platform: 'greenhouse', token: 'arxroboticsgmbh', domain: 'arx-robotics.com' },
  { name: 'Exein', slug: 'exein', platform: 'greenhouse', token: 'exeinspa', domain: 'exein.io' },
  { name: 'PhysicsX', slug: 'physicsx', platform: 'greenhouse', token: 'physicsx', domain: 'physicsx.ai' },
  { name: 'Primer AI', slug: 'primer-ai', platform: 'greenhouse', token: 'primerai', domain: 'primer.ai' },
  { name: 'D-Fend Solutions', slug: 'd-fend-solutions', platform: 'lever', token: 'd-fendsolutions', domain: 'd-fendsolutions.com' },
  { name: 'Loft Orbital', slug: 'loft-orbital', platform: 'lever', token: 'loftorbital', domain: 'loftorbital.com' },
  { name: 'Skyral', slug: 'skyral', platform: 'lever', token: 'skyralio', domain: 'skyral.com' },
  { name: 'Orasio', slug: 'orasio', platform: 'lever', token: 'orasio', domain: 'orasio.com', region: 'eu' },
  { name: 'Quantinuum', slug: 'quantinuum', platform: 'lever', token: 'quantinuum', domain: 'quantinuum.com', region: 'eu' },
  { name: 'Hypersonica', slug: 'hypersonica', platform: 'lever', token: 'hypersonica-prod', domain: 'hypersonica.com' },
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

// Greenhouse's `content` field is HTML-entity-encoded within the JSON
// string itself (literal "&lt;div&gt;", not "<div>") — decode before
// handing it to dangerouslySetInnerHTML. Lever's description fields are
// already raw HTML and don't need this.
const NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
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

async function fetchJson(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${url} responded ${res.status}`);
  return res.json();
}

const LEVER_HOSTS = { global: 'api.lever.co', eu: 'api.eu.lever.co' };

// Fetches the full job set for one company, including each job's full HTML
// description — only ever called from the sync route (see app/api/sync-jobs
// /route.js), never from a page request, so there's no size/latency reason
// to hold back `content=true` the way the old page-request-time fetchers
// had to (a large board's list can balloon several-fold in size once
// content is included; that concern doesn't apply to a once-a-day
// background job the way it would to something in the request path).
async function fetchGreenhouseJobsForSync(company) {
  const data = await fetchJson(`https://boards-api.greenhouse.io/v1/boards/${company.token}/jobs?content=true`);
  return (data.jobs || []).map((job) => {
    const departmentMeta = job.metadata?.find(
      (m) => m.name === 'External Department Name for Job Board'
    );
    const department = departmentMeta?.value || job.departments?.[0]?.name || null;
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
      applyUrl: job.absolute_url,
      descriptionHtml: decodeHtmlEntities(job.content) || '',
      postedAt: job.first_published || job.updated_at || null,
      featured: false,
    };
  });
}

async function fetchLeverJobsForSync(company) {
  const host = LEVER_HOSTS[company.region || 'global'];
  const data = await fetchJson(`https://${host}/v0/postings/${company.token}?mode=json`);
  return (data || []).map((job) => {
    const { workplaceType, locations } = parseJobLocation(job.categories?.location, {
      context: `${company.name} #${job.id}`,
      structuredWorkplaceType: job.workplaceType,
      structuredCountry: resolveCountryAlias(job.country),
    });
    const sections = (job.lists || [])
      .map((section) => `<h3>${section.text}</h3>${section.content || ''}`)
      .join('');
    const descriptionHtml = `${job.description || ''}${sections}${job.closing || ''}`;
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
      applyUrl: job.applyUrl || job.hostedUrl,
      descriptionHtml,
      postedAt: job.createdAt ? new Date(job.createdAt).toISOString() : null,
      featured: false,
    };
  });
}

const SYNC_FETCHERS = {
  greenhouse: fetchGreenhouseJobsForSync,
  lever: fetchLeverJobsForSync,
};

// Fetches every configured ATS company's current job set, for the sync
// route to persist into Supabase. One entry per company, never throws — a
// failed company is reported as such so the sync route can log it and
// leave that company's existing rows untouched rather than wiping them.
export async function fetchAllAtsJobsForSync() {
  const settled = await Promise.allSettled(
    COMPANIES.map((company) => SYNC_FETCHERS[company.platform](company))
  );
  return settled.map((result, index) => ({
    slug: COMPANIES[index].slug,
    name: COMPANIES[index].name,
    status: result.status,
    jobs: result.status === 'fulfilled' ? result.value : undefined,
    reason: result.status === 'rejected' ? String(result.reason) : undefined,
  }));
}

// Job <-> ats_jobs row mapping. The row is just the job shape in snake_case
// plus a couple of DB-only columns (synced_at) - kept as explicit mapping
// functions rather than relying on column order so a schema change in one
// place doesn't silently break the other.
export function jobToAtsJobRow(job) {
  return {
    id: job.id,
    company: job.company,
    company_slug: job.companySlug,
    company_domain: job.companyDomain,
    platform: job.id.startsWith('gh-') ? 'greenhouse' : 'lever',
    platform_id: job.platformId,
    title: job.title,
    location: job.location,
    locations: job.locations,
    workplace_type: job.workplaceType,
    department: job.department,
    role_type: job.roleType,
    employment_type: job.employmentType,
    apply_url: job.applyUrl,
    description_html: job.descriptionHtml,
    posted_at: job.postedAt,
  };
}

function atsJobRowToJob(row) {
  return {
    id: row.id,
    platformId: row.platform_id,
    title: row.title,
    company: row.company,
    companySlug: row.company_slug,
    companyDomain: row.company_domain,
    location: row.location,
    locations: row.locations,
    workplaceType: row.workplace_type,
    department: row.department,
    roleType: row.role_type,
    employmentType: row.employment_type,
    postedAt: row.posted_at,
    featured: false,
  };
}

// Editors pick workplaceType/roleType explicitly from Select fields (see
// customtypes/careers_post/index.json) rather than having them guessed from
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

// The columns the list view actually renders/filters on (see JobsBoard.js) -
// deliberately omits description_html and apply_url, which only the detail
// page (getAtsJobDetail below) needs. A large board's descriptions alone
// can add several MB across its rows, for data the list never displays.
const ATS_JOB_LIST_COLUMNS =
  'id, company, company_slug, company_domain, platform_id, title, location, locations, workplace_type, department, role_type, employment_type, posted_at';

const SUPABASE_ROW_PAGE_SIZE = 1000;

// PostgREST caps a single select() at 1000 rows by default - confirmed live
// the hard way, back when this table held a company with 2000+ open roles:
// a plain `.select(...)` silently truncated the table to its first 1000
// rows the moment the total crossed that line, with no error to signal it.
// Pages through with .range() until a page comes back short of a full page.
async function fetchAllAtsJobRows(supabase) {
  const rows = [];
  let from = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await supabase
      .from('ats_jobs')
      .select(ATS_JOB_LIST_COLUMNS)
      .range(from, from + SUPABASE_ROW_PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data || []));
    if (!data || data.length < SUPABASE_ROW_PAGE_SIZE) break;
    from += SUPABASE_ROW_PAGE_SIZE;
  }
  return rows;
}

// Reads ATS-sourced jobs from Supabase (populated by the cron-triggered
// sync route, not fetched live here) and merges them with manual postings,
// which are still read live from Prismic on every call — that's cheap and
// already has its own caching story (Prismic's CDN + this app's page-level
// revalidate), so there's no reason to also route it through ats_jobs.
export async function getAllJobs() {
  const supabase = createPublicClient();
  const [manualJobs, atsRows] = await Promise.all([
    fetchManualJobsUncached(),
    fetchAllAtsJobRows(supabase).catch((err) => {
      // Fails soft (ATS jobs just don't show) if the migration in
      // supabase/migrations hasn't been applied yet, or the sync route
      // hasn't run for the first time.
      console.warn('ats_jobs read failed:', err.message);
      return [];
    }),
  ]);

  const atsJobs = atsRows.map(atsJobRowToJob);
  const jobs = [...manualJobs, ...atsJobs];
  jobs.sort((a, b) => (b.postedAt || '').localeCompare(a.postedAt || ''));
  return jobs;
}

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

async function getAtsJobDetail(company, platformId) {
  const prefix = company.platform === 'greenhouse' ? 'gh' : 'lever';
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('ats_jobs')
    .select('*')
    .eq('id', `${prefix}-${company.slug}-${platformId}`)
    .maybeSingle();
  if (error || !data) return null;
  return {
    title: data.title,
    company: data.company,
    companySlug: data.company_slug,
    companyDomain: data.company_domain,
    location: data.location,
    workplaceType: data.workplace_type,
    department: data.department,
    roleType: data.role_type,
    employmentType: data.employment_type,
    applyUrl: data.apply_url,
    descriptionHtml: data.description_html || '',
    postedAt: data.posted_at,
  };
}

export async function getJobDetail(companySlug, platformId) {
  const company = getCompanyBySlug(companySlug);
  if (company) {
    try {
      return await getAtsJobDetail(company, platformId);
    } catch (err) {
      console.warn(`Job detail read failed for ${companySlug}/${platformId}:`, err);
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
