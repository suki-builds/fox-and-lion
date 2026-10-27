'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CONSENT_ACCEPTED,
  CONSENT_REJECTED,
  OPEN_COOKIE_SETTINGS_EVENT,
  getConsent,
  setConsent,
} from '../lib/cookieConsent';

// Shown until the visitor makes a choice, and again from the footer's
// "Cookie settings" link. Accept and Reject sit side by side with equal
// weight, as the ICO expects - rejecting mustn't take more effort than
// accepting.
export default function CookieBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (getConsent() === null) setOpen(true);
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
  }, []);

  function choose(value) {
    setConsent(value);
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="cookie-banner" role="region" aria-label="Cookie consent">
      <div className="cookie-banner__inner">
        <p className="cookie-banner__text">
          We use essential cookies to keep you signed in. With your permission, we will
          also set one cookie to count article views and shares accurately. No advertising
          or cross-site tracking. See our <Link href="/privacy-policy">Privacy Policy</Link>.
        </p>
        <div className="cookie-banner__actions">
          <button
            type="button"
            className="cookie-banner__button"
            onClick={() => choose(CONSENT_REJECTED)}
          >
            Reject
          </button>
          <button
            type="button"
            className="cookie-banner__button"
            onClick={() => choose(CONSENT_ACCEPTED)}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
