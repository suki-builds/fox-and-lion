'use client';

import { createClient } from '../lib/supabase/client';

// One sign-in button per provider: 'google', or 'linkedin_oidc' (LinkedIn's
// "Sign In with LinkedIn using OpenID Connect", set up under Supabase's
// Authentication > Providers). Both land on app/auth/callback/route.ts.
// Supabase links accounts by email, so the same address on Google and
// LinkedIn is one account.
const LABELS = {
  google: 'Sign in with Google',
  linkedin_oidc: 'Sign in with LinkedIn',
};

// Carries the sign-in page's newsletter choice through the OAuth redirect
// to app/auth/callback/route.ts, which subscribes the account's email once
// sign-in succeeds. A short-lived cookie rather than a query parameter on
// redirectTo - see the note below on why that URL stays bare. Strictly
// functional and set only on this click, so it needs no cookie consent.
export const NEWSLETTER_OPTIN_COOKIE = 'fl_newsletter_optin';

export default function OAuthSignInButton({ provider, disabled = false, newsletter = false }) {
  async function handleSignIn() {
    if (disabled) return;
    document.cookie = newsletter
      ? `${NEWSLETTER_OPTIN_COOKIE}=1; Max-Age=600; Path=/; SameSite=Lax; Secure`
      : `${NEWSLETTER_OPTIN_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax; Secure`;
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        // No query string here - Supabase's Redirect URLs allowlist matches
        // the full requested URL, and an allowlisted bare
        // ".../auth/callback" entry won't match one with a "?next=..."
        // appended. The callback defaults to /account on its own instead.
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <button
      type="button"
      className="submission-form__submit"
      onClick={handleSignIn}
      disabled={disabled}
    >
      {LABELS[provider]}
    </button>
  );
}
