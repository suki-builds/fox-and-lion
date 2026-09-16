import { asHTML, ParsingError } from '@prismicio/client';
import { parseJobLocation, formatLocations, resolveCountryAlias } from './location';
import { getCareersPostsList, getCareersPostByUID } from './prismic';
import { createPublicClient } from './supabase/public';
import { isBuildPhase, withRetry } from './resilientRead';

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

  // Second research pass over the same spreadsheet, checking every
  // remaining company against live Greenhouse/Lever APIs (not just a
  // plausible token guess - each of these was confirmed by pulling real
  // job data and checking it actually matches the company, after ruling
  // out several token collisions with unrelated companies of the same
  // name). Most of the rest of the spreadsheet runs on Personio,
  // Recruitee, Workable, Ashby, or Teamtailor instead of Greenhouse/
  // Lever - reaching much further past this count needs those platforms
  // integrated, not more searching for Greenhouse/Lever tokens.
  { name: 'Isar Aerospace', slug: 'isar-aerospace', platform: 'greenhouse', token: 'isaraerospace', domain: 'isaraerospace.com' },
  { name: 'Auterion', slug: 'auterion', platform: 'greenhouse', token: 'auterion', domain: 'auterion.com' },
  { name: 'Constellr', slug: 'constellr', platform: 'greenhouse', token: 'constellrgmbh', domain: 'constellr.com' },
  { name: 'Saildrone', slug: 'saildrone', platform: 'greenhouse', token: 'saildroneinc', domain: 'saildrone.com' },

  // Ashby companies - see fetchAshbyJobsForSync above for why the earlier
  // "no single-job endpoint" exclusion of Shield AI no longer applies now
  // that jobs are synced (full descriptionHtml and all) rather than fetched
  // live per page view. Domains verified directly (se3.ai only - se3labs.ai
  // is an unrelated company with the same name, a robot-eval-infra startup,
  // not this Munich defence-drone one).
  { name: 'Shield AI', slug: 'shield-ai', platform: 'ashby', token: 'shield-ai', domain: 'shield.ai' },
  { name: 'Delian Alliance Industries', slug: 'delian-alliance-industries', platform: 'ashby', token: 'delian', domain: 'delian.ai' },
  { name: 'SE3 Labs', slug: 'se3-labs', platform: 'ashby', token: 'se3', domain: 'se3.ai' },

  // Workable companies - tokens are the account name from their
  // apply.workable.com URL, verified directly against the live API
  // (?details=true), not just a resolving careers-page link.
  { name: 'Oxford Dynamics', slug: 'oxford-dynamics', platform: 'workable', token: 'oxforddynamics', domain: 'oxdynamics.com' },
  { name: 'ALL.SPACE', slug: 'all-space', platform: 'workable', token: 'allspace', domain: 'all.space' },
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

// FullTime/PartTime/Intern - Ashby's own enum casing, confirmed directly
// against live boards. Contract wasn't seen in any sampled company's data,
// but included since it's an obvious enum completion; falls back to the
// raw value (rather than dropping it) if Ashby ever adds another one.
const ASHBY_EMPLOYMENT_TYPES = {
  FullTime: 'Full-time',
  PartTime: 'Part-time',
  Contract: 'Contract',
  Intern: 'Internship',
};

// Ashby's board endpoint returns every listed job's full HTML description
// in the same bulk call (confirmed directly against Shield AI/Delian/SE3's
// live boards) - unlike hitting a single job's own endpoint, which 401s on
// Ashby's public API. That per-job limitation is exactly why Shield AI was
// excluded when this site fetched ATS data live on each page request; now
// that everything goes through this once-a-day sync into Supabase instead
// (see fetchAllAtsJobsForSync), it no longer matters - the full
// descriptionHtml is captured here once and served from Supabase like
// every other platform's detail page.
async function fetchAshbyJobsForSync(company) {
  const data = await fetchJson(`https://api.ashbyhq.com/posting-api/job-board/${company.token}`);
  return (data.jobs || []).map((job) => {
    const { workplaceType, locations } = parseJobLocation(job.location, {
      context: `${company.name} #${job.id}`,
      // Ashby's own workplaceType is 'OnSite'/'Hybrid'/'Remote' - lowercased
      // here so parseJobLocation's shared capitalize-first-letter logic
      // produces 'Onsite' (matching what Lever-sourced jobs already
      // produce for the same concept), not 'OnSite' with a stray capital S.
      structuredWorkplaceType: job.workplaceType ? job.workplaceType.toLowerCase() : null,
    });
    return {
      id: `ashby-${company.slug}-${job.id}`,
      platformId: job.id,
      title: job.title,
      company: company.name,
      companySlug: company.slug,
      companyDomain: company.domain,
      location: formatLocations(locations, workplaceType),
      locations,
      workplaceType,
      department: job.department || null,
      roleType: classifyRoleType(`${job.department || ''} ${job.title}`),
      employmentType: ASHBY_EMPLOYMENT_TYPES[job.employmentType] || job.employmentType || null,
      applyUrl: job.applyUrl,
      descriptionHtml: job.descriptionHtml || '',
      postedAt: job.publishedAt ? new Date(job.publishedAt).toISOString() : null,
      featured: false,
    };
  });
}

// Workable's list endpoint (?details=true) returns each job's full
// description HTML in the same bulk call - confirmed directly, no per-job
// fetch needed, same as Greenhouse/Ashby.
//
// Unlike those two, a multi-location posting comes back as multiple
// *separate* entries sharing the same shortcode (one per location) rather
// than one entry with several locations nested inside - confirmed against
// ALL.SPACE's live board, which listed "Chief Growth Officer" twice, once
// for Muscle Shoals and once for Huntsville. Grouped back into one job per
// shortcode below, merging each duplicate's single-item `locations` array.
async function fetchWorkableJobsForSync(company) {
  const data = await fetchJson(`https://apply.workable.com/api/v1/widget/accounts/${company.token}?details=true`);
  const byShortcode = new Map();
  for (const job of data.jobs || []) {
    const existing = byShortcode.get(job.shortcode);
    if (existing) {
      existing.locations.push(...(job.locations || []));
    } else {
      byShortcode.set(job.shortcode, { ...job, locations: [...(job.locations || [])] });
    }
  }
  return Array.from(byShortcode.values()).map((job) => {
    // Workable already hands back a resolved city/region/country per
    // location (unlike Greenhouse/Lever's free-text field), so this skips
    // parseJobLocation's text-guessing entirely and builds the same
    // { city, country, region, raw, confident } shape directly.
    const locationEntries =
      job.locations.length > 0 ? job.locations : [{ city: job.city, country: job.country, region: job.state }];
    const locations = locationEntries.map((loc) => ({
      city: loc.city || null,
      country: loc.country || null,
      region: loc.region || null,
      raw: [loc.city, loc.region, loc.country].filter(Boolean).join(', '),
      confident: Boolean(loc.country),
    }));
    // No hybrid/onsite/remote enum in this endpoint - telecommuting is the
    // only structured workplace signal it gives us, so only Remote is ever
    // inferred here; a hybrid/onsite posting just shows its location(s)
    // with no workplace-type badge, rather than guessing.
    const workplaceType = job.telecommuting ? 'Remote' : null;
    return {
      id: `workable-${company.slug}-${job.shortcode}`,
      platformId: job.shortcode,
      title: job.title,
      company: company.name,
      companySlug: company.slug,
      companyDomain: company.domain,
      location: formatLocations(locations, workplaceType),
      locations,
      workplaceType,
      department: job.department || job.function || null,
      roleType: classifyRoleType(`${job.department || job.function || ''} ${job.title}`),
      employmentType: job.employment_type || null,
      applyUrl: job.application_url,
      descriptionHtml: job.description || '',
      postedAt: job.published_on ? new Date(job.published_on).toISOString() : null,
      featured: false,
    };
  });
}

const SYNC_FETCHERS = {
  greenhouse: fetchGreenhouseJobsForSync,
  lever: fetchLeverJobsForSync,
  ashby: fetchAshbyJobsForSync,
  workable: fetchWorkableJobsForSync,
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

// Every job id is built as `${prefix}-${companySlug}-${platformId}` (see
// each fetch*JobsForSync above) - the prefix alone identifies the platform
// regardless of how many hyphens the company slug itself contains, since
// it's always the first segment.
const PLATFORM_ID_PREFIXES = { greenhouse: 'gh', lever: 'lever', ashby: 'ashby', workable: 'workable' };

function platformFromJobId(id) {
  const prefix = id.split('-')[0];
  return Object.keys(PLATFORM_ID_PREFIXES).find((platform) => PLATFORM_ID_PREFIXES[platform] === prefix);
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
    platform: platformFromJobId(job.id),
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

async function fetchManualJobs() {
  const docs = await withRetry(() => getCareersPostsList());
  return docs.map(normalizeManualJob);
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
//
// Either source failing used to be swallowed into an empty list, so a single
// Supabase blip during a regeneration cached /careers with every ATS job
// missing - and the homepage's jobs section with it - for up to an hour. An
// empty ats_jobs table still returns [] without an error; only a failed read
// counts as a failure. See lib/resilientRead.js:
//   - at runtime, throw, so the last good board keeps being served
//   - during a build, render whatever did load. That's temporary (both
//     pages regenerate hourly), and any job it leaves out of
//     generateStaticParams still renders on demand, so it isn't worth
//     failing a deploy over.
export async function getAllJobs() {
  const supabase = createPublicClient();
  const [manual, ats] = await Promise.allSettled([
    fetchManualJobs(),
    withRetry(() => fetchAllAtsJobRows(supabase)),
  ]);

  const failures = [manual, ats]
    .filter((result) => result.status === 'rejected')
    .map((result) => result.reason?.message || String(result.reason));
  if (failures.length > 0) {
    if (!isBuildPhase()) {
      throw new Error(`Job listings unavailable: ${failures.join('; ')}`);
    }
    console.error(`Job listings read failed during build; rendering what loaded: ${failures.join('; ')}`);
  }

  const manualJobs = manual.status === 'fulfilled' ? manual.value : [];
  const atsJobs = (ats.status === 'fulfilled' ? ats.value : []).map(atsJobRowToJob);
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
  const doc = await withRetry(async () => {
    try {
      return await getCareersPostByUID(uid);
    } catch (err) {
      // A malformed uid - a crawler URL containing a backslash, for one -
      // makes Prismic reject the query itself with a ParsingError rather
      // than a NotFoundError. That job can't exist, so it's a 404 like any
      // other unknown uid, not an outage worth retrying. Letting it throw
      // would turn a cheap cached 404 into an uncached error re-rendered on
      // every crawler hit. Checked against the live repo: every other kind
      // of junk uid tried came back as NotFoundError.
      if (err instanceof ParsingError) return null;
      throw err;
    }
  });
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
  const prefix = PLATFORM_ID_PREFIXES[company.platform];
  const supabase = createPublicClient();
  // `error || !data` used to return null for both, so a failed read looked
  // exactly like a job that doesn't exist. The detail page turns null into a
  // 404 cached for a day - a Supabase blip during a regeneration would have
  // shown a live job as "Role not found", to visitors and to search engines,
  // for 24 hours. Only a genuinely absent row is null now.
  const data = await withRetry(async () => {
    const { data: row, error } = await supabase
      .from('ats_jobs')
      .select('*')
      .eq('id', `${prefix}-${company.slug}-${platformId}`)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });
  if (!data) return null;
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

// For generateMetadata (see the job detail page) - only manual (careers_post)
// jobs have Prismic-authored meta_title/meta_description/meta_image fields
// for buildMetadata to read; ATS-sourced jobs live entirely outside Prismic,
// so there's nothing to fetch for those. Returns null for both "job not
// found" and "this is an ATS job" - the caller treats both the same way,
// falling back to a generated title/description.
export async function getJobMetadataData(companySlug, platformId) {
  if (getCompanyBySlug(companySlug)) return null;
  try {
    const doc = await getCareersPostByUID(platformId);
    return doc?.data || null;
  } catch (err) {
    console.warn(`Manual job metadata fetch failed for ${platformId}:`, err);
    return null;
  }
}

// Returns null only when the job genuinely doesn't exist. A failed read
// throws instead - at runtime and during a build alike. Unlike the board, a
// degraded result here isn't cosmetic: null becomes a cached 404 for a real
// job. So if a build can list a job but can't then load it, the build fails
// and the previous deployment stays live, rather than shipping that 404.
// (If Supabase is down entirely during a build, getAllJobs lists no ATS jobs,
// none get prerendered, and nothing here runs - so the build still passes.)
export async function getJobDetail(companySlug, platformId) {
  const company = getCompanyBySlug(companySlug);
  if (company) {
    return getAtsJobDetail(company, platformId);
  }

  // Not a known ATS company slug — assume a manually-posted job. platformId
  // (the Prismic UID) is unique on its own, so this doesn't need companySlug
  // to disambiguate; it's only present in the URL for a readable path.
  return getManualJobDetail(platformId);
}
