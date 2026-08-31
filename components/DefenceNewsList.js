import Link from 'next/link';
import { getPageMeta } from '../lib/ogImage';
import { resolveSourceName } from '../lib/format';
import { effectivePublishedAt, sortByPublishedAt } from '../lib/publishedDate';
import PostEngagement from './PostEngagement';

const MAX_ITEMS = 4;

function formatDate(date) {
  if (!date) return null;
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// The homepage's News section — a compact list, image/headline/source all
// linking to Fox and Lion's own internal summary page for that item, not
// out to the original source article.
export default async function DefenceNewsList({ posts }) {
  const items = sortByPublishedAt(posts || []).slice(0, MAX_ITEMS);

  if (items.length === 0) {
    return <p style={{ padding: '1.5rem 0' }}>Nothing published yet.</p>;
  }

  const metas = await Promise.all(items.map((post) => getPageMeta(post.data.source_url)));

  return (
    <div className="news-list">
      {items.map((post, index) => {
        const meta = metas[index];
        const sourceName = resolveSourceName(meta.siteName, post.data.source_url);
        const href = `/news/${post.uid}`;

        return (
          <div className="news-list__item" key={post.id}>
            {meta.image && (
              <Link href={href} className="news-list__thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={meta.image} alt="" />
              </Link>
            )}
            <div>
              <Link href={href} className="news-list__headline-link">
                <h3 className="news-list__headline">{post.data.title}</h3>
              </Link>
              {sourceName && (
                <Link href={href} className="news-list__source">
                  {sourceName}
                </Link>
              )}
              <span className="news-list__time">{formatDate(effectivePublishedAt(post))}</span>
              <PostEngagement postUid={post.uid} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
