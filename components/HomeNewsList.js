'use client';

import Link from 'next/link';
import PostEngagement from './PostEngagement';
import { useFreshStats } from '../lib/useFreshStats';

// Renders the homepage's News section and refreshes its stats
// (views/comments/shares/score) client-side - see lib/useFreshStats.js -
// so they don't sit stale for up to an hour (this page's ISR revalidate
// window) waiting on the next regeneration. `items` is a small, already
// server-fetched/shaped array (see DefenceNewsList.js), not raw Prismic
// documents.
export default function HomeNewsList({ items }) {
  const initialStats = {};
  items.forEach((item) => {
    initialStats[item.uid] = item.stats;
  });
  const uids = items.map((item) => item.uid);
  const freshStats = useFreshStats('news', uids, initialStats);

  return (
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
            <PostEngagement
              postUid={item.uid}
              postType="news"
              archived={item.archived}
              stats={freshStats[item.uid] || item.stats}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
