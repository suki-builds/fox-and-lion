// Monochrome line-icon for the News post view count, matching
// CommentIcon.js's style - a single flat color rather than a multicolor
// emoji glyph. Three ascending bars, replacing the earlier eye glyph.
export default function BarChartIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect x="3.5" y="14" width="4" height="7" rx="0.5" />
      <rect x="10" y="9.5" width="4" height="11.5" rx="0.5" />
      <rect x="16.5" y="4.5" width="4" height="16.5" rx="0.5" />
    </svg>
  );
}
