'use client';

import { useState } from 'react';

// Homepage newsletter block. Sign-ups land in the newsletter_subscribers
// Supabase table (see supabase/migrations/0024_newsletter_subscribers.sql);
// nothing is sent from here - the list is exported to a mail tool by hand.
export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  // 'idle' | 'submitting' | 'success' | 'error'
  const [status, setStatus] = useState('idle');

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus('submitting');
    try {
      const res = await fetch('/api/newsletter-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('Sign-up failed');
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  return (
    <section className="newsletter" aria-labelledby="newsletter-heading">
      <p className="newsletter__label">Newsletter</p>
      <h2 id="newsletter-heading" className="newsletter__heading">
        Defence tech analysis, news and jobs, in your inbox.
      </h2>
      {status === 'success' ? (
        <p className="newsletter__status is-success">
          Thanks &mdash; you&rsquo;re on the list.
        </p>
      ) : (
        <form className="newsletter__form" onSubmit={handleSubmit}>
          <input
            type="email"
            aria-label="Email address"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <button
            type="submit"
            className="newsletter__submit"
            disabled={!email.trim() || status === 'submitting'}
          >
            {status === 'submitting' ? 'Signing up…' : 'Sign up'}
          </button>
        </form>
      )}
      {status === 'error' && (
        <p className="newsletter__status is-error">
          Something went wrong. Please try again.
        </p>
      )}
      <p className="newsletter__note">
        Unsubscribe at any time. See our <a href="/privacy-policy">Privacy Policy</a>.
      </p>
    </section>
  );
}
