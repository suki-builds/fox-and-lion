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

// Outlets whose name is an acronym, not a word — title-casing the domain
// label would otherwise turn "rusi.org" into "Rusi" instead of "RUSI".
// Add to this as more come up in real content.
const SOURCE_NAME_OVERRIDES = {
  rusi: 'RUSI',
  bbc: 'BBC',
  cnn: 'CNN',
  npr: 'NPR',
  pbs: 'PBS',
  'euro-sd': 'Euro-SD',
};

// Derives a display name from a source URL's domain (e.g.
// "https://www.reuters.com/..." -> "Reuters") since News posts only
// store the URL, not a separate source-name field.
function sourceNameFromUrl(url) {
  if (!url) return null;
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    const label = hostname.split('.')[0];
    const override = SOURCE_NAME_OVERRIDES[label.toLowerCase()];
    if (override) return override;
    return label
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  } catch {
    return null;
  }
}

// A single row in a post list — category, headline, excerpt, byline/source,
// date, and an optional thumbnail. Used by the homepage feed plus the
// Analysis and News list pages so all three stay visually consistent.
export default function PostCard({
  href,
  date,
  title,
  excerpt,
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
