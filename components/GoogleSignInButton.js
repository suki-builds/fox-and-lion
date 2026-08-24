'use client';

import { createClient } from '../lib/supabase/client';

export default function GoogleSignInButton() {
  async function handleSignIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/account`,
      },
    });
  }

  return (
    <button type="button" className="submission-form__submit" onClick={handleSignIn}>
      Sign in with Google
    </button>
  );
}
