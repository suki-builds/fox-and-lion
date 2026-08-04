// Drop this in anywhere an illustration/photo will eventually go.
// Swap it for a real <img> once you've sourced the image — search
// "IllustrationPlaceholder" in the codebase to find every spot using one.
export default function IllustrationPlaceholder({ label = 'Illustration TBD' }) {
  return (
    <div className="illustration-placeholder">
      <span>{label}</span>
    </div>
  );
}
