'use client';

import { useState } from 'react';
import PostCard from './PostCard';
import PostEngagement from './PostEngagement';

// Exported so app/(public)/news/page.js can eagerly scrape og:image
// metadata for exactly the posts shown on first load (expensive: a live
// fetch to each source article) without also doing it for every post ever
// published - the rest is fetched lazily, per batch, as "Load more" reveals
// them (see handleLoadMore below and app/api/news-thumbnails/route.js).
export const PAGE_SIZE = 20;

// Renders the first PAGE_SIZE items and reveals PAGE_SIZE more per click,
// avoiding an unbounded DOM/scroll length as the News archive grows. All
// items (and their vote/view/comment/share stats - cheap, a single indexed
// DB query regardless of how many posts exist) are already fetched
// server-side. Thumbnails are the expensive part (a live fetch to each
// source article), so only the first page's worth is pre-fetched
// server-side - "load more" fetches the next batch's thumbnails from
// /api/news-thumbnails on demand instead of every post ever published
// paying that cost on every regeneration.
export default function NewsListClient({ posts }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [thumbnails, setThumbnails] = useState({});
  const [loadingMore, setLoadingMore] = useState(false);
  const visiblePosts = posts.slice(0, visibleCount);
  const hasMore = visibleCount < posts.length;

  async function handleLoadMore() {
    const nextBatch = posts.slice(visibleCount, visibleCount + PAGE_SIZE);
    const needsFetch = nextBatch.filter((post) => post.sourceUrl && !(post.uid in thumbnails));

    if (needsFetch.length > 0) {
      setLoadingMore(true);
      try {
        const res = await fetch('/api/news-thumbnails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: needsFetch.map((post) => ({ uid: post.uid, sourceUrl: post.sourceUrl })),
          }),
        });
        if (res.ok) {
          const { items } = await res.json();
          setThumbnails((prev) => {
            const next = { ...prev };
            items.forEach((item) => {
              next[item.uid] = { sourceName: item.sourceName, coverImageUrl: item.coverImageUrl };
            });
            return next;
          });
        }
      } catch {
        // Thumbnails are a nice-to-have, not essential content - fail soft,
        // the newly revealed cards just render without one.
      } finally {
        setLoadingMore(false);
      }
    }

    setVisibleCount((count) => count + PAGE_SIZE);
  }

  return (
    <>
      <div className="post-grid" style={{ marginTop: '2rem' }}>
        {visiblePosts.length === 0 && (
          <p style={{ padding: '1.5rem' }}>Nothing published yet.</p>
        )}
        {visiblePosts.map((post) => {
          const lazy = thumbnails[post.uid];
          return (
            <PostCard
              key={post.id}
              href={post.href}
              date={post.date}
              title={post.title}
              sourceUrl={post.sourceUrl}
              sourceName={lazy?.sourceName ?? post.sourceName}
              coverImageUrl={lazy?.coverImageUrl ?? post.coverImageUrl}
              compact
              engagement={
                <PostEngagement
                  postUid={post.uid}
                  postType="news"
                  archived={post.archived}
                  stats={post.stats}
                />
              }
            />
          );
        })}
      </div>
      {hasMore && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
          <button
            type="button"
            className="load-more-button"
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </>
  );
}
