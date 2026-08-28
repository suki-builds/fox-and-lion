// The single canonical source-name mapping — every place on the site that
// displays a News item's source (Home Page Defence News, the /news list,
// the /news/[slug] detail page) resolves through resolveSourceName() below,
// which always checks this table first. This is the one place to add or
// change a source's display name; don't hardcode names elsewhere.
//
// Keyed by the URL's hostname with "www." stripped, usually just the first
// label (e.g. "www.gov.uk" -> "gov", "therecord.media" -> "therecord"). A
// site whose identity lives in a subdomain (e.g. "en.defence-ua.com") is
// keyed by that longer prefix instead ("en.defence-ua") — curatedSourceName()
// below tries the full hostname first and shortens from the end, so this
// still matches without sweeping in every other unrelated "en.*" domain.
const SOURCE_NAMES = {
  
  aviationweek:'Aviation Week',
  army:'U.S. Army',
  bbc: 'BBC',
  breakingdefense: 'Breaking Defense',
  businesskorea: 'BusinessKorea',
  cnn: 'CNN',
  'defence-blog': 'Defence Blog',
  'en.defence-ua': 'Defense Express',
  edgegroup: 'EDGE Group',
  defensenews: 'Defense News',
  defenseone: 'Defense One',
  defensescoop: 'DefenseScoop',
  defensesecurityasia: 'Defence Security Asia',
  'euro-sd': 'Euro-SD',
  euronews: 'Euronews',
  focustaiwan: 'Focus Taiwan',
  ft: 'FT',
  gov: 'UK Government',
  koreajoongangdaily: 'Korea JoongAng Daily',
  maritime: 'U.S. Maritime Administration',
  nationalinterest: 'The National Interest',
  navy: 'U.S. Navy',
  navalnews: 'Naval News',
  navaltoday: 'Naval Today',
  navylookout: 'Navy Lookout',
  newatlas: 'New Atlas',
  'news.northropgrumman.com': 'Northrop Grumman',
  northropgrumman: 'Northrop Grumman',
  npr: 'NPR',    
  pbs: 'PBS',
  prnewswire: 'PR Newswire',
  rtx: 'RTX',
  rusi: 'RUSI',
  scmp: 'SCMP',
  sofx: 'SOFX',
  stirlingx: 'StirlingX',
  stripes: 'Stars and Stripes',
  taiwannews: 'Taiwan News',
  telegraph: 'The Telegraph',
  thebulwark: 'The Bulwark',
  theguardian: 'The Guardian',
  thehill: 'The Hill',
  therecord: 'The Record',
  tomshardware: 'Tom\'s Hardware',
  tvpworld: 'TVP World',
  twz: 'TWZ',
  ukdefencejournal: 'UK Defence Journal',
  youtube: 'YouTube',
  washingtonpost: 'The Washington Post',
};

function domainLabel(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '').split('.')[0].toLowerCase();
  } catch {
    return null;
  }
}

// Looks up SOURCE_NAMES against the full hostname first, then progressively
// drops trailing labels down to just the first one — so a curated multi-label
// key like "en.defence-ua" matches that specific site, while other
// "en.*" hosts (with no such entry) still fall through untouched instead of
// all colliding on the shared first label.
function curatedSourceName(url) {
  let hostname;
  try {
    hostname = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
  const labels = hostname.split('.');
  for (let dropped = 0; dropped < labels.length; dropped += 1) {
    const candidate = labels.slice(0, labels.length - dropped).join('.');
    if (SOURCE_NAMES[candidate]) return SOURCE_NAMES[candidate];
  }
  return null;
}

// Falls back to guessing a name from the domain label itself (e.g.
// "https://www.reuters.com/..." -> "Reuters") for sources not yet in
// SOURCE_NAMES above. Not exported — resolveSourceName() is the only
// public entry point, so there's exactly one function every consumer calls.
function guessNameFromUrl(url) {
  const label = domainLabel(url);
  if (!label) return null;
  return label
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// The one function every consumer calls to display a source name.
// Precedence: curated SOURCE_NAMES entry (if we've added one) > the
// outlet's own self-declared og:site_name (fetched and cached via
// lib/ogImage.js, passed in as `siteName` where available) > a mechanical
// guess from the domain. A curated entry always wins once added, since
// some outlets' og:site_name is a full tagline rather than a clean name
// (e.g. "Navy Lookout - Independent Royal Navy news and analysis").
//
// `siteName` is optional — pass null/undefined where live og:site_name
// isn't fetched (e.g. the /news list view); the curated table still
// applies identically either way, which is what keeps every view in sync.
export function resolveSourceName(siteName, url) {
  const curated = curatedSourceName(url);
  return curated || (siteName && siteName.trim()) || guessNameFromUrl(url);
}
