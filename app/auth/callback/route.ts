import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

// Landing point for the OAuth redirect - Supabase sends the browser here
// with a `code` param after the user approves sign-in with Google.
// Exchanging it for a session is what actually sets the auth cookie.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // Defaults to /account rather than / - the only sign-in entry point
  // right now is GoogleSignInButton, which doesn't pass its own `next`
  // (see that file for why: keeping redirectTo query-string-free so it
  // exact-matches Supabase's Redirect URLs allowlist entry).
  const next = searchParams.get('next') || '/account';

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=auth`);
}
