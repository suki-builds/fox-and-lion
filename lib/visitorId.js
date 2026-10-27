import { hasAnalyticsConsent, readCookie } from './cookieConsent';

const COOKIE_NAME = 'fl_visitor_id';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

// Used instead of the cookie when the visitor hasn't accepted cookies: the
// view or share still counts, it just isn't deduped across page loads.
let pageLoadId = null;

// Anonymous, client-only identifier used to dedupe News post view counts
// per browser (see supabase/migrations/0002_news_post_views_and_stats.sql).
// Not tied to Supabase Auth - readers shouldn't need to sign in just to be
// counted as a view, unlike voting.
//
// Only stored as a cookie once the visitor accepts cookies (see
// lib/cookieConsent.js and components/CookieBanner.js).
export function getOrCreateVisitorId() {
  if (!hasAnalyticsConsent()) {
    if (!pageLoadId) pageLoadId = crypto.randomUUID();
    return pageLoadId;
  }

  const existing = readCookie(COOKIE_NAME);
  if (existing) return existing;

  const id = pageLoadId || crypto.randomUUID();
  document.cookie = `${COOKIE_NAME}=${id}; max-age=${ONE_YEAR_SECONDS}; path=/; samesite=lax`;
  return id;
}
