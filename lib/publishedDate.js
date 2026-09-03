// Both Analysis and News documents have two possible publish timestamps:
// the manually-entered `published_at` field (editors can set this to the
// content's real publish time, which may differ from when the record was
// entered into Prismic) and Prismic's own system `first_publication_date`
// (always populated, reflects when the document was first published).
// `published_at` wins whenever it's set; `first_publication_date` is the
// fallback for documents where an editor left it blank.
export function effectivePublishedAt(doc) {
  return doc.data.published_at ?? doc.first_publication_date;
}

// Sorts documents newest-first by their effective publish date. Prismic
// can't sort by a fallback expression server-side, so every place that
// lists Analysis or News documents re-sorts client-side using this after
// fetching.
export function sortByPublishedAt(docs) {
  return [...docs].sort((a, b) => {
    const aDate = effectivePublishedAt(a) || '';
    const bDate = effectivePublishedAt(b) || '';
    return bDate.localeCompare(aDate);
  });
}

// News posts older than this stop accepting new votes/comments (still
// fully visible, just read-only) - see isArchived below. This is a UI-only
// gate, not enforced by Supabase RLS: news_post_votes/news_post_comments
// have no way to know a post's Prismic-sourced publish date, so a
// determined user could still call the Supabase API directly to vote on an
// archived post. Worth revisiting with a trusted server-side check (e.g.
// storing each post's published_at in Supabase) if that turns out to
// matter in practice - low stakes for now, unlike the comment depth cap
// and flood guard in supabase/migrations, which guard against real abuse.
export const ARCHIVE_AFTER_DAYS = 7;

export function isOlderThanDays(dateString, days) {
  if (!dateString) return false;
  return Date.now() - new Date(dateString).getTime() > days * 24 * 60 * 60 * 1000;
}

export function isArchived(doc) {
  return isOlderThanDays(effectivePublishedAt(doc), ARCHIVE_AFTER_DAYS);
}
