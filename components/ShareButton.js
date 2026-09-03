'use client';

import { useState } from 'react';

// Feather icons' "share-2" glyph - matches SearchIcon's stroke style
// (currentColor, no fill) so it sits consistently alongside the rest of
// the site's line icons.
function ShareIcon(props) {
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
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

// Uses the native share sheet where available (mobile browsers, and most
// desktop browsers now too); falls back to copying the URL to the
// clipboard - reads location.href at click time rather than needing the
// canonical URL passed down as a prop from the server component above it.
//
// Deliberately shares { url } alone, with no title/text - WebKit's
// navigator.share() treats a URL passed together with a separate title as
// two distinct share items (text + link) rather than one enrichable link,
// which skips iOS's automatic rich-preview fetch (real og:image + title)
// entirely and falls back to a generic icon. Sharing the URL alone lets
// iOS fetch and build that preview itself, exactly like pasting a link
// into Messages already did correctly.
export default function ShareButton() {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ url });
      } catch {
        // User dismissed the share sheet - nothing to do.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access denied - nothing more we can do here.
    }
  }

  return (
    <button type="button" className="share-button" onClick={handleShare}>
      <ShareIcon className="share-button__icon" />
      {copied ? 'Copied!' : 'Share'}
    </button>
  );
}
