'use client';

import { useEffect, useRef, useState } from 'react';
import ShareIcon from './ShareIcon';
import { recordShare, shareCurrentUrl } from '../lib/share';

// Touch devices get the native share sheet (falling back to copying the URL
// to the clipboard). Desktop gets a small menu of our own instead: Windows'
// and macOS's share windows can't be dismissed by clicking elsewhere on the
// page, and this menu can - an outside click or Escape closes it.
//
// postUid/postType let the share get recorded against the post it came from
// (see lib/share.js, record_share) - omit them for a share button with
// nothing to attribute to. `compact` renders a smaller variant for sitting
// inline next to the vote/view/comment bar, instead of the full-size button
// below the article body.
const TARGETS = [
  { label: 'LinkedIn', href: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${url}` },
  { label: 'X', href: (url) => `https://x.com/intent/post?url=${url}` },
  { label: 'Bluesky', href: (url) => `https://bsky.app/intent/compose?text=${url}` },
  { label: 'Email', href: (url) => `mailto:?body=${url}` },
];

function prefersShareSheet() {
  return typeof navigator.share === 'function' && window.matchMedia('(pointer: coarse)').matches;
}

export default function ShareButton({ postUid, postType, compact = false }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const [pageUrl, setPageUrl] = useState('');
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  function flashCopied() {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleClick() {
    if (prefersShareSheet()) {
      const outcome = await shareCurrentUrl({ postUid, postType });
      if (outcome === 'copied') flashCopied();
      return;
    }
    setPageUrl(window.location.href);
    setOpen((value) => !value);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(pageUrl);
    } catch {
      // Clipboard access denied - nothing more we can do here.
      return;
    }
    recordShare({ postUid, postType });
    setOpen(false);
    flashCopied();
  }

  function handleTarget() {
    recordShare({ postUid, postType });
    setOpen(false);
  }

  const encodedUrl = encodeURIComponent(pageUrl);

  return (
    <span className="share" ref={rootRef}>
      <button
        type="button"
        className={`share-button${compact ? ' share-button--compact' : ''}`}
        onClick={handleClick}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <ShareIcon className="share-button__icon" />
        {copied ? 'Copied!' : 'Share'}
      </button>
      {open && (
        <span className="share-menu" role="menu">
          <button type="button" className="share-menu__item" role="menuitem" onClick={handleCopy}>
            Copy link
          </button>
          {TARGETS.map(({ label, href }) => (
            <a
              key={label}
              className="share-menu__item"
              role="menuitem"
              href={href(encodedUrl)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleTarget}
            >
              {label}
            </a>
          ))}
        </span>
      )}
    </span>
  );
}
