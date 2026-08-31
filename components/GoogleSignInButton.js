'use client';

import { createClient } from '../lib/supabase/client';

export default function GoogleSignInButton({ disabled = false }) {
  async function handleSignIn() {
    if (disabled) return;
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
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
      Sign in with Google
    </button>
  );
}
