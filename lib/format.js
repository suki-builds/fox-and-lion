// Outlets whose domain label doesn't title-case cleanly on its own —
// either it's an acronym ("rusi.org" -> "Rusi" instead of "RUSI"), or
// it's multiple words squashed together with no separator ("therecord.media"
// -> "Therecord" instead of "The Record"). Add to this as more come up in
// real content.
const SOURCE_NAME_OVERRIDES = {
  rusi: 'RUSI',
  bbc: 'BBC',
  cnn: 'CNN',
  npr: 'NPR',
  pbs: 'PBS',
  'euro-sd': 'Euro-SD',
  therecord: 'The Record',
  navaltoday: 'Naval Today',
  defensenews: 'Defense News',
  defensescoop: 'DefenseScoop',
  ukdefencejournal: 'UK Defence Journal',
  navylookout: 'Navy Lookout',
  'defence-blog': 'The Defence Blog',
  ft: 'FT',
  gov: 'GOV.UK',
};

function domainLabel(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '').split('.')[0].toLowerCase();
  } catch {
    return null;
  }
}

// Prefers a manually curated name over the outlet's self-declared
// og:site_name over guessing one from the domain. Some outlets' og:site_name
// is a full tagline rather than a clean name (e.g. "Navy Lookout -
// Independent Royal Navy news and analysis"), so a curated override, once
// added, always wins over that live-fetched value.
export function resolveSourceName(siteName, url) {
  const override = SOURCE_NAME_OVERRIDES[domainLabel(url)];
  return override || (siteName && siteName.trim()) || sourceNameFromUrl(url);
}

// Derives a display name from a source URL's domain (e.g.
// "https://www.reuters.com/..." -> "Reuters") since News posts only
// store the URL, not a separate source-name field. Used as a fallback when
// the source page doesn't declare an og:site_name.
export function sourceNameFromUrl(url) {
  if (!url) return null;
  const label = domainLabel(url);
  if (!label) return null;
  const override = SOURCE_NAME_OVERRIDES[label];
  if (override) return override;
  return label
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Renders a past date as "3h ago" / "2d ago" / "5mo ago" etc, matching the
// wire-style timestamps used in the Defence News list.
export function timeAgo(date) {
  if (!date) return null;
  const then = new Date(date).getTime();
  if (Number.isNaN(then)) return null;

  const diffMs = Date.now() - then;
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;

  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears}y ago`;
}
