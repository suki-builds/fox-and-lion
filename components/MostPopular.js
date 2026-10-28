import Link from 'next/link';
import Image from 'next/image';
import BarChartIcon from './BarChartIcon';
import { getTopViewedPosts } from '../lib/postStats';
import { formatCompactNumber } from '../lib/format';
import { coverImageSrc } from '../lib/prismicImage';

const MAX_ITEMS = 5;
const WINDOW_DAYS = 30;

// The homepage's "Most Popular" box: the most-viewed analysis articles of
// the last 30 days, ranked, with their views over that same window. Refreshed
// with the homepage's own ISR window rather than live - a ranking that's up
// to an hour old is fine here.
//
// A stacked text list on phones; on wide screens the same markup becomes a
// row of five image cards (the cover image is hidden below that - see
// globals.css). Rendered as a single tab for now; a second "Most Discussed"
// tab can sit alongside it later.
export default async function MostPopular({ posts }) {
  // Over-fetch: the ranking can include uids of posts that have since been
  // unpublished, which are dropped below.
  const top = await getTopViewedPosts('analysis', { days: WINDOW_DAYS, limit: MAX_ITEMS * 4 });
  const postsByUid = new Map(posts.map((post) => [post.uid, post]));
  const ranked = top
    .filter(({ uid, views }) => views > 0 && postsByUid.has(uid))
    .slice(0, MAX_ITEMS)
    .map(({ uid, views }) => ({ post: postsByUid.get(uid), views }));

  if (ranked.length === 0) return null;

  return (
    <section className="most-popular" aria-labelledby="most-popular-heading">
      <div className="most-popular__tabs">
        <h2 id="most-popular-heading" className="most-popular__tab is-active">
          Most Popular
        </h2>
        <span className="most-popular__window">Last {WINDOW_DAYS} days</span>
      </div>
      <ol className="most-popular__list">
        {ranked.map(({ post, views }, index) => (
          <li key={post.id} className="most-popular__item">
            {post.data.cover_image?.url && (
              <Link href={`/analysis/${post.uid}`} className="most-popular__media" tabIndex={-1}>
                <Image
                  src={coverImageSrc(post.data.cover_image.url, { w: 600 })}
                  alt=""
                  fill
                  sizes="240px"
                  quality={85}
                />
              </Link>
            )}
            <span className="most-popular__rank" aria-hidden="true">
              {index + 1}
            </span>
            <div className="most-popular__body">
              <Link href={`/analysis/${post.uid}`} className="most-popular__title">
                {post.data.title}
              </Link>
              <div className="most-popular__meta">
                {post.data.author && <span>{post.data.author}</span>}
                <span
                  className="most-popular__views"
                  aria-label={`${views} views in the last ${WINDOW_DAYS} days`}
                >
                  <BarChartIcon className="most-popular__views-icon" />
                  {formatCompactNumber(views)}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
