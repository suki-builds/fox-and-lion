// Normalizes the free-text location strings that Greenhouse and Lever hand
// back (e.g. "London, England, United Kingdom", "Munich - Berlin - London",
// "Chicago, IL", "Singapore, Singapore") into a consistent { city, country }
// shape, plus a separate workplaceType (Remote/Hybrid/Onsite) instead of
// treating "Remote" as if it were a place.
//
// This is a small, hand-maintained dictionary covering the countries/cities
// that actually show up across Anduril, Palantir, and Helsing's boards today
// (checked directly against their live APIs) — not an attempt at a general
// geo database. Extend the three tables below as new companies/locations
// are added. Anything that doesn't resolve confidently is left with
// confident: false and logged, rather than guessed at.

// Country name/abbreviation variants -> canonical name. Includes the ISO
// 3166-1 alpha-2 codes Lever's `country` field uses (job.country = "GB"),
// so both the free-text location string and Lever's structured field
// resolve to the same canonical string.
const COUNTRY_ALIASES = {
  'uk': 'United Kingdom', 'u.k': 'United Kingdom', 'united kingdom': 'United Kingdom',
  'great britain': 'United Kingdom', 'england': 'United Kingdom', 'scotland': 'United Kingdom',
  'wales': 'United Kingdom', 'northern ireland': 'United Kingdom', 'gb': 'United Kingdom',

  'us': 'United States', 'usa': 'United States', 'u.s.a': 'United States',
  'united states': 'United States', 'united states of america': 'United States',

  'netherlands': 'Netherlands', 'the netherlands': 'Netherlands', 'holland': 'Netherlands', 'nl': 'Netherlands',
  'germany': 'Germany', 'de': 'Germany',
  'belgium': 'Belgium', 'be': 'Belgium',
  'ireland': 'Ireland', 'ie': 'Ireland',
  'poland': 'Poland', 'pl': 'Poland',
  'australia': 'Australia', 'au': 'Australia',
  'japan': 'Japan', 'jp': 'Japan',
  'saudi arabia': 'Saudi Arabia', 'sa': 'Saudi Arabia',
  'taiwan': 'Taiwan', 'tw': 'Taiwan',
  'united arab emirates': 'United Arab Emirates', 'uae': 'United Arab Emirates', 'ae': 'United Arab Emirates',
  'denmark': 'Denmark', 'dk': 'Denmark',
  'spain': 'Spain', 'es': 'Spain',
  'france': 'France', 'fr': 'France',
  'israel': 'Israel', 'il': 'Israel',
  'south korea': 'South Korea', 'republic of korea': 'South Korea', 'korea, republic of': 'South Korea', 'kr': 'South Korea',
  'lithuania': 'Lithuania', 'lt': 'Lithuania',
  'norway': 'Norway', 'no': 'Norway',
  'sweden': 'Sweden', 'se': 'Sweden',
  'singapore': 'Singapore', 'sg': 'Singapore',
  'estonia': 'Estonia', 'ee': 'Estonia',
};

// US state abbreviations (as seen from Lever/Greenhouse's "City, ST" shape)
// plus DC — kept separate from COUNTRY_ALIASES so a 2-letter state code
// (e.g. "IL" for Illinois) can never collide with the same letters used as
// an ISO country code (e.g. "IL" for Israel, from Lever's structured field).
const US_STATE_ABBR = new Set([
  'al', 'ak', 'az', 'ar', 'ca', 'co', 'ct', 'de', 'fl', 'ga', 'hi', 'id', 'il', 'in', 'ia',
  'ks', 'ky', 'la', 'me', 'md', 'ma', 'mi', 'mn', 'ms', 'mo', 'mt', 'ne', 'nv', 'nh', 'nj',
  'nm', 'ny', 'nc', 'nd', 'oh', 'ok', 'or', 'pa', 'ri', 'sc', 'sd', 'tn', 'tx', 'ut', 'vt',
  'va', 'wa', 'wv', 'wi', 'wy', 'dc',
]);

// Bare city names (no comma, no country) that show up in Helsing's board —
// e.g. "Berlin", "Munich - Berlin - London".
const CITY_COUNTRY = {
  berlin: 'Germany',
  munich: 'Germany',
  paris: 'France',
  london: 'United Kingdom',
  oxford: 'United Kingdom',
  barcelona: 'Spain',
  stockholm: 'Sweden',
  tallinn: 'Estonia',
};

function normalizeToken(token) {
  return token.trim().toLowerCase().replace(/\./g, '');
}

export function resolveCountryAlias(token) {
  if (!token) return null;
  return COUNTRY_ALIASES[normalizeToken(token)] || null;
}

function resolveUsState(token) {
  if (!token) return null;
  return US_STATE_ABBR.has(normalizeToken(token)) ? 'United States' : null;
}

// Splits a raw location field into individual location strings. Greenhouse
// and Lever both join multi-location postings with "; ", but Helsing's
// Greenhouse board sometimes uses " - " instead (e.g.
// "Munich - Berlin - London - Paris") — handle both.
function splitLocationSegments(raw) {
  if (!raw) return [];
  return raw
    .split(/\s*;\s*|\s+-\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseLocationSegment(raw, context) {
  const trimmed = raw.trim();
  const parts = trimmed.split(',').map((p) => p.trim()).filter(Boolean);

  let result;
  if (parts.length === 1) {
    const country = CITY_COUNTRY[normalizeToken(parts[0])] || resolveCountryAlias(parts[0]);
    result = country
      ? { city: CITY_COUNTRY[normalizeToken(parts[0])] ? parts[0] : null, country, region: null }
      : null;
  } else if (parts.length === 2) {
    const [first, second] = parts;
    const country = resolveUsState(second) || resolveCountryAlias(second);
    result = country ? { city: first, country, region: resolveUsState(second) ? second : null } : null;
  } else {
    const first = parts[0];
    const last = parts[parts.length - 1];
    const country = resolveCountryAlias(last);
    result = country ? { city: first, country, region: parts.slice(1, -1).join(', ') || null } : null;
  }

  if (!result) {
    console.warn(`[location] Could not confidently parse "${trimmed}"${context ? ` (${context})` : ''}`);
    return { city: null, country: null, region: null, raw: trimmed, confident: false };
  }
  return { ...result, raw: trimmed, confident: true };
}

const REMOTE_PATTERN = /^remote$/i;

// Parses a raw ATS location string into a workplace type (Remote/Hybrid/
// Onsite/null) plus a list of normalized { city, country, region, raw,
// confident } locations. "Remote" is pulled out as its own segment rather
// than kept as a location, since it isn't a place.
//
// `structuredWorkplaceType` lets callers pass a platform-provided value
// (Lever's `workplaceType` field is authoritative — 'hybrid'/'onsite'/
// 'remote' — so text-guessing is skipped entirely when it's available).
//
// `structuredCountry` (an already-resolved canonical country, e.g. via
// resolveCountryAlias(job.country) for Lever's ISO country code) is used as
// a fallback for segments the text parser couldn't confidently resolve —
// e.g. Lever's "North America" free-text location paired with
// job.country: "US" becomes a confident United States entry instead of an
// unparsed one, since that's ground truth from the platform, not a guess.
export function parseJobLocation(raw, { context, structuredWorkplaceType, structuredCountry } = {}) {
  const segments = splitLocationSegments(raw);

  let workplaceType = null;
  if (structuredWorkplaceType) {
    workplaceType = structuredWorkplaceType.charAt(0).toUpperCase() + structuredWorkplaceType.slice(1);
  }

  const locationSegments = segments.filter((segment) => {
    if (REMOTE_PATTERN.test(segment)) {
      if (!workplaceType) workplaceType = 'Remote';
      return false;
    }
    return true;
  });

  const locations = locationSegments.map((segment) => {
    const parsed = parseLocationSegment(segment, context);
    if (!parsed.confident && structuredCountry) {
      return { city: null, country: structuredCountry, region: null, raw: parsed.raw, confident: true };
    }
    return parsed;
  });

  return { workplaceType, locations };
}

// Builds a short human-readable string from parsed locations, for display
// in job rows/detail pages where we just need text, not the structured data.
export function formatLocations(locations, workplaceType) {
  if (locations.length === 0) return workplaceType === 'Remote' ? 'Remote' : null;
  return locations
    .map((loc) => (loc.confident ? [loc.city, loc.country].filter(Boolean).join(', ') : loc.raw))
    .join('; ');
}
