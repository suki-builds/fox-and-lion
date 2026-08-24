'use client';

import { createClient } from '../lib/supabase/client';

export default function GoogleSignInButton() {
  async function handleSignIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
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
    <button type="button" className="submission-form__submit" onClick={handleSignIn}>
      Sign in with Google
    </button>
  );
}
