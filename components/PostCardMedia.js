'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

const PRISMIC_IMAGE_HOST = 'https://images.prismic.io/';

// Renders the PostCard thumbnail. With no image URL, or if the image fails
// to load (e.g. a scraped og:image that 404s), it renders `placeholder` in
// the same box if one was given (the News list passes one, so every row
// keeps the same text alignment) and otherwise nothing at all - no
// broken-image icon, no "Illustration TBD" placeholder.
//
// News thumbnails are arbitrary external og:image scrapes (see
// lib/ogImage.js) - those can't go through next/image (it requires every
// remote host to be pre-registered in next.config.mjs's remotePatterns,
// infeasible for arbitrary source sites), so they stay a plain <img>.
// Analysis thumbnails are our own Prismic-hosted assets, so those do go
// through next/image - each unique cropped variant is then fetched from
// Prismic's origin once total (cached at Vercel's edge) rather than once
// per site visitor. See the bandwidth note in the migration plan.
export default function PostCardMedia({ src, alt, className, aspectRatio, placeholder }) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef(null);

  // An image that fails before hydration has already fired its error event
  // by the time onError is attached - catch that on mount (same as
  // HomeNewsList's NewsThumb).
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (!src || failed) {
    if (!placeholder) return null;
    return (
      <div className="post-card__media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={placeholder} alt="" />
      </div>
    );
  }

  const wrapperClassName = `post-card__media${className ? ` ${className}` : ''}`;
  // Only meaningful alongside the cover-ratio className - the default
  // fixed-box thumbnail (News's scraped og:images) ignores this and keeps
  // its CSS-defined width/height crop.
  const wrapperStyle = aspectRatio ? { aspectRatio } : undefined;

  if (src.startsWith(PRISMIC_IMAGE_HOST)) {
    return (
      <div className={wrapperClassName} style={wrapperStyle}>
        <Image
          src={src}
          alt={alt || ''}
          fill
          sizes="(max-width: 640px) 100vw, 220px"
          quality={90}
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className={wrapperClassName} style={wrapperStyle}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={imgRef} src={src} alt={alt || ''} onError={() => setFailed(true)} />
    </div>
  );
}
