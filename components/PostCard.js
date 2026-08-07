import Link from 'next/link';
import IllustrationPlaceholder from './IllustrationPlaceholder';
import { sourceNameFromUrl } from '../lib/format';

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
  const sourceName = sourceNameFromUrl(sourceUrl);

  return (
    <Link href={href} className="post-card">
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
      {showMedia && (
        <div className="post-card__media">
          {coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverImageUrl} alt={coverImageAlt || ''} />
          ) : (
            <IllustrationPlaceholder />
          )}
        </div>
      )}
    </Link>
  );
}
