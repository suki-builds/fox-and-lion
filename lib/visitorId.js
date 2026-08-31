const COOKIE_NAME = 'fl_visitor_id';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

// Anonymous, client-only identifier used to dedupe News post view counts
// per browser (see supabase/migrations/0002_news_post_views_and_stats.sql).
// Not tied to Supabase Auth - readers shouldn't need to sign in just to be
// counted as a view, unlike voting.
export function getOrCreateVisitorId() {
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]+)`));
  if (match) return match[1];

  const id = crypto.randomUUID();
  document.cookie = `${COOKIE_NAME}=${id}; max-age=${ONE_YEAR_SECONDS}; path=/; samesite=lax`;
  return id;
}
