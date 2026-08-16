import Link from 'next/link';
import PostCardMedia from './PostCardMedia';
import { resolveSourceName } from '../lib/format';

export function initials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// A single row in a post list — category, headline, byline/source, date,
// and an optional thumbnail. Used by the homepage feed plus the Analysis
// and News list pages so both stay visually consistent.
export default function PostCard({
  href,
  date,
  title,
  byline,
  category,
  sourceUrl,
  sourceName: sourceNameProp,
  showMedia = true,
  coverImageUrl,
  coverImageAlt,
}) {
  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;
  // Callers that already fetched live og:site_name (e.g. the News list,
  // which fetches it for the cover image anyway) can pass a resolved
  // sourceName directly so it matches the Home Page and detail page. Falls
  // back to resolving from the URL alone — a domain guess for anything not
  // in the curated table — when no live siteName is available.
  const sourceName = sourceNameProp ?? (sourceUrl ? resolveSourceName(null, sourceUrl) : null);

  return (
    <Link href={href} className="post-card">
      {showMedia && <PostCardMedia src={coverImageUrl} alt={coverImageAlt} />}
      <div className="post-card__content">
        {category && <span className="category-tag">{category}</span>}
        <h2>{title}</h2>
        <div className="post-card__meta">
          {byline && (
            <>
              <span className="post-card__byline-name">{byline}</span>
              {formattedDate && <span>&middot;</span>}
            </>
          )}
          {sourceName && (
            <>
              <span className="post-card__source">{sourceName}</span>
              {formattedDate && <span>&middot;</span>}
            </>
          )}
          {formattedDate && <span className="post-card__date">{formattedDate}</span>}
        </div>
      </div>
    </Link>
  );
}
