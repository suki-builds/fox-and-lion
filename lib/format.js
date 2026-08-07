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
};

// Derives a display name from a source URL's domain (e.g.
// "https://www.reuters.com/..." -> "Reuters") since News posts only
// store the URL, not a separate source-name field.
export function sourceNameFromUrl(url) {
  if (!url) return null;
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    const label = hostname.split('.')[0];
    const override = SOURCE_NAME_OVERRIDES[label.toLowerCase()];
    if (override) return override;
    return label
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  } catch {
    return null;
  }
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
