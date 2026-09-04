'use client';

import { useState } from 'react';
import ShareIcon from './ShareIcon';
import { shareCurrentUrl } from '../lib/share';

// Uses the native share sheet where available (mobile browsers, and most
// desktop browsers now too); falls back to copying the URL to the
// clipboard. postUid/postType let the share get recorded against the post
// it came from (see lib/share.js, record_share) - omit them for a share
// button with nothing to attribute to. `compact` renders a smaller variant
// for sitting inline next to the vote/view/comment bar, instead of the
// full-size button below the article body.
export default function ShareButton({ postUid, postType, compact = false }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const outcome = await shareCurrentUrl({ postUid, postType });
    if (outcome === 'copied') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      type="button"
      className={`share-button${compact ? ' share-button--compact' : ''}`}
      onClick={handleShare}
    >
      <ShareIcon className="share-button__icon" />
      {copied ? 'Copied!' : 'Share'}
    </button>
  );
}
