import Link from 'next/link';
import IllustrationPlaceholder from './IllustrationPlaceholder';

export function initials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// A single row in a post list — category, headline, excerpt, byline, date,
// and an optional thumbnail. Used by the homepage feed plus the Analysis,
// News, and Careers list pages so all four stay visually consistent.
export default function PostCard({
  href,
  date,
  title,
  excerpt,
  byline,
  category,
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

  return (
    <Link href={href} className="post-card">
      <div className="post-card__content">
        {category && <span className="post-card__category">{category}</span>}
        <h2>{title}</h2>
        {excerpt && <p className="post-card__excerpt">{excerpt}</p>}
        <div className="post-card__meta">
          {byline && (
            <>
              <span className="post-card__avatar">{initials(byline)}</span>
              <span className="post-card__byline-name">{byline}</span>
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
