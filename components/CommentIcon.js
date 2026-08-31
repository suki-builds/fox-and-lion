// Monochrome line-icon for the News post comment count, matching
// EyeIcon.js's style - a single flat color rather than a multicolor emoji
// glyph. Rectangular speech bubble with a small tail, not a rounded/oval
// bubble.
export default function CommentIcon(props) {
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
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
