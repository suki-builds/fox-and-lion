// The visitor's cookie choice, stored in a cookie of its own (a strictly
// necessary one - remembering a refusal is the one thing that can't wait
// for consent).
//
// What the choice actually governs: fl_visitor_id (see lib/visitorId.js),
// the only non-essential cookie on the site. Supabase's auth cookies are
// strictly necessary for signing in, and Vercel Analytics sets none.
// Nothing non-essential is written until the visitor accepts.
const CONSENT_COOKIE = 'fl_cookie_consent';
// Six months, then ask again - the usual re-prompt interval.
const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 182;

export const CONSENT_ACCEPTED = 'accepted';
export const CONSENT_REJECTED = 'rejected';

// Fired to reopen the banner from the footer's "Cookie settings" link.
export const OPEN_COOKIE_SETTINGS_EVENT = 'fl:open-cookie-settings';

export function readCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return match ? match[1] : null;
}

// 'accepted' | 'rejected' | null (not chosen yet)
export function getConsent() {
  const value = readCookie(CONSENT_COOKIE);
  return value === CONSENT_ACCEPTED || value === CONSENT_REJECTED ? value : null;
}

export function hasAnalyticsConsent() {
  return getConsent() === CONSENT_ACCEPTED;
}

export function setConsent(value) {
  document.cookie = `${CONSENT_COOKIE}=${value}; max-age=${CONSENT_MAX_AGE_SECONDS}; path=/; samesite=lax`;
  // Withdrawing consent has to remove what was already set, not just stop
  // setting it.
  if (value === CONSENT_REJECTED) {
    document.cookie = 'fl_visitor_id=; max-age=0; path=/; samesite=lax';
  }
}
