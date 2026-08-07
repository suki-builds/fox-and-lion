import { getPageMeta } from '../lib/ogImage';
import { resolveSourceName, timeAgo } from '../lib/format';

const MAX_ITEMS = 8;

// The homepage's News section — a compact list, image/headline/source all
// linking out to the original source article since this is a pointer to
// outlets' own reporting, not our commentary.
export default async function DefenceNewsList({ posts }) {
  const items = (posts || []).slice(0, MAX_ITEMS);

  if (items.length === 0) {
    return <p style={{ padding: '1.5rem 0' }}>Nothing published yet.</p>;
  }

  const metas = await Promise.all(items.map((post) => getPageMeta(post.sourceUrl)));

  return (
    <div className="news-list">
      {items.map((post, index) => {
        const meta = metas[index];
        const sourceName = resolveSourceName(meta.siteName, post.sourceUrl);

        return (
          <div className="news-list__item" key={post.id}>
            {meta.image && (
              <a
                href={post.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="news-list__thumb"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={meta.image} alt="" />
              </a>
            )}
            <div>
              <a
                href={post.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="news-list__headline-link"
              >
                <h3 className="news-list__headline">{post.title}</h3>
              </a>
              {sourceName && (
                <a
                  href={post.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="news-list__source"
                >
                  {sourceName}
                </a>
              )}
              <span className="news-list__time">{timeAgo(post.publishedDate)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
