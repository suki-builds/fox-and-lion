'use client';

import Link from 'next/link';
import PostEngagement from './PostEngagement';
import PostStatsProvider from './PostStatsProvider';

// Renders the homepage's News section. The provider refreshes its stats
// (views/comments/shares/score) client-side so they don't sit stale for up
// to an hour (this page's ISR revalidate window) waiting on the next
// regeneration, and resolves the signed-in visitor's own vote, which can't
// be looked up server-side without dropping this page out of ISR - see
// components/PostStatsProvider.js. `items` is a small, already
// server-fetched/shaped array (see DefenceNewsList.js), not raw Prismic
// documents.
export default function HomeNewsList({ items }) {
  const initialStats = {};
  items.forEach((item) => {
    initialStats[item.uid] = item.stats;
  });
  const uids = items.map((item) => item.uid);

  return (
    <PostStatsProvider postType="news" uids={uids} initialStats={initialStats}>
      <div className="news-list">
        {items.map((item) => (
          <div className="news-list__item" key={item.id}>
            {item.imageUrl && (
              <Link href={item.href} className="news-list__thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.imageUrl} alt="" />
              </Link>
            )}
            <div>
              <Link href={item.href} className="news-list__headline-link">
                <h3 className="news-list__headline">{item.title}</h3>
              </Link>
              {item.sourceName && (
                <Link href={item.href} className="news-list__source">
                  {item.sourceName}
                </Link>
              )}
              <span className="news-list__time">{item.formattedDate}</span>
              <PostEngagement postUid={item.uid} postType="news" archived={item.archived} />
            </div>
          </div>
        ))}
      </div>
    </PostStatsProvider>
  );
}
