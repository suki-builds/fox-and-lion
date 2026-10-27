'use client';

import { OPEN_COOKIE_SETTINGS_EVENT } from '../lib/cookieConsent';

// Footer link that reopens the cookie banner, so a choice can be changed
// as easily as it was made.
export default function CookieSettingsLink() {
  return (
    <button
      type="button"
      className="site-footer__link-button"
      onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT))}
    >
      Cookie Settings
    </button>
  );
}
