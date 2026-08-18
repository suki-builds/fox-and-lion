'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import IllustrationPlaceholder from './IllustrationPlaceholder';
import ExcerptMarkdown from './ExcerptMarkdown';

// The image always stays centered against whatever height the row ends up
// being (its rule never changes) - but a plain CSS grid row's height is
// always driven by whichever child is tallest, so when the text column is
// taller than the image, centering the image within that taller row no
// longer puts its top edge anywhere near the text's top. There's no way
// for static CSS to conditionally branch on "is the text taller than the
// image" (that's a runtime comparison between two auto-sized siblings), so
// this measures both after render and switches to a top-aligned layout
// only when the text actually is taller — otherwise the default centered
// styling (shared with the homepage hero) applies untouched.
export default function AnalysisHero({ coverImageUrl, coverImageAlt, category, title, excerpt }) {
  const mediaRef = useRef(null);
  // hero__copy itself is the flex item the grid stretches/centers, so its
  // own rendered height reflects whichever alignment mode is *currently*
  // active, not the text's natural height - contentRef is a plain inner
  // div (unaffected by the outer flex alignment) measured instead, so the
  // comparison stays accurate regardless of which mode was last applied.
  const contentRef = useRef(null);
  const [topAligned, setTopAligned] = useState(false);

  useLayoutEffect(() => {
    const mediaEl = mediaRef.current;
    const contentEl = contentRef.current;
    if (!mediaEl || !contentEl) return;

    function measure() {
      setTopAligned(contentEl.offsetHeight > mediaEl.offsetHeight);
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(mediaEl);
    observer.observe(contentEl);
    return () => observer.disconnect();
  }, []);

  return (
    <section className={`hero${topAligned ? ' hero--top-aligned' : ''}`}>
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
      <div className="hero__copy">
        <div ref={contentRef}>
          <p className="hero__label">{category || 'Analysis'}</p>
          <h1>{title}</h1>
          <ExcerptMarkdown className="hero__eyebrow">{excerpt}</ExcerptMarkdown>
        </div>
      </div>
    </section>
  );
}
