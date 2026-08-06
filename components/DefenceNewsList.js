import Link from 'next/link';
import { getOgImage } from '../lib/ogImage';
import { sourceNameFromUrl, timeAgo } from '../lib/format';

const MAX_ITEMS = 8;

// Same underlying News content as the /news page and the homepage's
// "Latest News" cards, just in a denser numbered-list format with a
// thumbnail pulled from each source article's og:image.
export default async function DefenceNewsList({ posts }) {
  const items = (posts || []).slice(0, MAX_ITEMS);

  if (items.length === 0) {
    return <p style={{ padding: '1.5rem 0' }}>Nothing published yet.</p>;
  }

  const thumbnails = await Promise.all(items.map((post) => getOgImage(post.sourceUrl)));

  return (
    <div className="news-list">
      {items.map((post, index) => (
        <Link href={`/news/${post.slug}`} className="news-list__item" key={post.id}>
          <span className="news-list__index">{String(index + 1).padStart(2, '0')}</span>
          {thumbnails[index] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="news-list__thumb" src={thumbnails[index]} alt="" />
          )}
          <div>
            <h3 className="news-list__headline">{post.title}</h3>
            <span className="news-list__source">{sourceNameFromUrl(post.sourceUrl)}</span>
            <span className="news-list__time">{timeAgo(post.publishedDate)}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
