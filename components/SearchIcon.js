// Monochrome line-icon replacement for the color 🔍 emoji, used everywhere
// search is triggered or shown (header buttons, search overlay input) so
// it stays a single flat color instead of a multicolor glyph.
export default function SearchIcon(props) {
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
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
