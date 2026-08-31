'use client';

import { useState } from 'react';
import PostCard from './PostCard';
import PostEngagement from './PostEngagement';

const PAGE_SIZE = 20;

// Renders the first PAGE_SIZE items and reveals PAGE_SIZE more per click,
// avoiding an unbounded DOM/scroll length as the News archive grows. All
// items are already fetched server-side (see app/(public)/news/page.js),
// so "load more" only expands how many are rendered, not a fresh fetch.
export default function NewsListClient({ posts }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visiblePosts = posts.slice(0, visibleCount);
  const hasMore = visibleCount < posts.length;

  return (
    <>
      <div className="post-grid" style={{ marginTop: '2rem' }}>
        {visiblePosts.length === 0 && (
          <p style={{ padding: '1.5rem' }}>Nothing published yet.</p>
        )}
        {visiblePosts.map((post) => (
          <PostCard
            key={post.id}
            href={post.href}
            date={post.date}
            title={post.title}
            sourceUrl={post.sourceUrl}
            sourceName={post.sourceName}
            coverImageUrl={post.coverImageUrl}
            compact
            engagement={<PostEngagement postUid={post.uid} />}
          />
        ))}
      </div>
      {hasMore && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
          <button
            type="button"
            className="load-more-button"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
          >
            Load more
          </button>
        </div>
      )}
    </>
  );
}
