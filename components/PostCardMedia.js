'use client';

import { useState } from 'react';
import Image from 'next/image';

const PRISMIC_IMAGE_HOST = 'https://images.prismic.io/';

// Renders the PostCard thumbnail, or nothing at all if there's no image
// URL or the image fails to load (e.g. a scraped og:image that 404s) —
// no broken-image icon, no "Illustration TBD" placeholder.
//
// News thumbnails are arbitrary external og:image scrapes (see
// lib/ogImage.js) - those can't go through next/image (it requires every
// remote host to be pre-registered in next.config.mjs's remotePatterns,
// infeasible for arbitrary source sites), so they stay a plain <img>.
// Analysis thumbnails are our own Prismic-hosted assets, so those do go
// through next/image - each unique cropped variant is then fetched from
// Prismic's origin once total (cached at Vercel's edge) rather than once
// per site visitor. See the bandwidth note in the migration plan.
export default function PostCardMedia({ src, alt, className }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) return null;

  const wrapperClassName = `post-card__media${className ? ` ${className}` : ''}`;

  if (src.startsWith(PRISMIC_IMAGE_HOST)) {
    return (
      <div className={wrapperClassName}>
        <Image
          src={src}
          alt={alt || ''}
          fill
          sizes="(max-width: 640px) 100vw, 220px"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className={wrapperClassName}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt || ''} onError={() => setFailed(true)} />
    </div>
  );
}
