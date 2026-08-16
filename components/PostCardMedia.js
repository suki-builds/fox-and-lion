'use client';

import { useState } from 'react';

// Renders the PostCard thumbnail, or nothing at all if there's no image
// URL or the image fails to load (e.g. a scraped og:image that 404s) —
// no broken-image icon, no "Illustration TBD" placeholder.
export default function PostCardMedia({ src, alt, className }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) return null;

  return (
    <div className={`post-card__media${className ? ` ${className}` : ''}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt || ''} onError={() => setFailed(true)} />
    </div>
  );
}
