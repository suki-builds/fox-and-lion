'use client';

import { useState } from 'react';

// Click-to-play YouTube embed: renders a plain thumbnail image (no iframe,
// no request to YouTube) until clicked, then swaps in the actual player
// using youtube-nocookie.com — privacy-enhanced mode, so no tracking
// cookies are set until the user actually presses play.
export default function YouTubeEmbed({ videoId, thumbnail, title }) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className="youtube-embed">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
          title={title || 'YouTube video player'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      className="youtube-embed youtube-embed--thumb"
      onClick={() => setPlaying(true)}
      aria-label={`Play video: ${title || 'YouTube video'}`}
    >
      {thumbnail && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumbnail} alt="" />
      )}
      <span className="youtube-embed__play" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </button>
  );
}
