'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import IllustrationPlaceholder from './IllustrationPlaceholder';
import ExcerptMarkdown from './ExcerptMarkdown';

// hero__media's own position never changes here - see the hero--article
// rules in globals.css for how hero__copy is decoupled from the grid
// row's height so it can be positioned against the image specifically
// (centered when it fits, top-aligned - overflowing only downward - when
// it doesn't) without the image itself ever moving or resizing. This
// component only measures both elements' natural heights and: (1) picks
// which of those two modes applies, and (2) sets an explicit min-height
// on the section so overflowing text (in the top-aligned case) doesn't
// spill past the section's own bottom border into the content below it.
export default function AnalysisHero({ coverImageUrl, coverImageAlt, category, title, excerpt }) {
  const sectionRef = useRef(null);
  const mediaRef = useRef(null);
  // hero__copy itself is the element the CSS makes position: absolute, so
  // its own rendered height would just reflect whatever inset: 0 forces it
  // to (the image's height) - it's only measured here for its padding
  // (read via getComputedStyle, so a future CSS change can't silently
  // desync this from the actual layout), not its own offsetHeight.
  const copyRef = useRef(null);
  // The plain inner div that actually wraps the text, measured for its
  // true natural height regardless of how hero__copy is currently sized.
  const contentRef = useRef(null);
  const [topAligned, setTopAligned] = useState(false);

  useLayoutEffect(() => {
    const sectionEl = sectionRef.current;
    const mediaEl = mediaRef.current;
    const copyEl = copyRef.current;
    const contentEl = contentRef.current;
    if (!sectionEl || !mediaEl || !copyEl || !contentEl) return;

    function measure() {
      const mediaHeight = mediaEl.offsetHeight;
      const copyStyle = getComputedStyle(copyEl);
      const copyVerticalPadding =
        parseFloat(copyStyle.paddingTop) + parseFloat(copyStyle.paddingBottom);
      // What hero__copy would need to be to fit its content without
      // clipping - contentEl's own height doesn't include hero__copy's
      // padding, so left on its own it understates how much room the text
      // actually needs.
      const requiredCopyHeight = contentEl.offsetHeight + copyVerticalPadding;
      setTopAligned(requiredCopyHeight > mediaHeight);
      sectionEl.style.minHeight = `${Math.max(mediaHeight, requiredCopyHeight)}px`;
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(mediaEl);
    observer.observe(contentEl);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      className={`hero hero--article${topAligned ? ' hero--top-aligned' : ''}`}
      ref={sectionRef}
    >
      <div className="hero__media" ref={mediaRef}>
        {coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImageUrl}
            alt={coverImageAlt || ''}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <IllustrationPlaceholder />
        )}
      </div>
      <div className="hero__copy" ref={copyRef}>
        <div ref={contentRef}>
          <p className="hero__label">{category || 'Analysis'}</p>
          <h1>{title}</h1>
          <ExcerptMarkdown className="hero__eyebrow">{excerpt}</ExcerptMarkdown>
        </div>
      </div>
    </section>
  );
}
