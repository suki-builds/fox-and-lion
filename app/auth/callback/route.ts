import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { createNewsletterSubscriber } from '../../../lib/formsSupabase';

// Set by OAuthSignInButton when the newsletter box on /sign-in is ticked.
// Not imported from there - that's a client component.
const NEWSLETTER_OPTIN_COOKIE = 'fl_newsletter_optin';

// Landing point for the OAuth redirect - Supabase sends the browser here
// with a `code` param after the user approves sign-in with Google or
// LinkedIn.
// Exchanging it for a session is what actually sets the auth cookie.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // Defaults to /account rather than / - the only sign-in entry point
  // right now is OAuthSignInButton, which doesn't pass its own `next`
  // (see that file for why: keeping redirectTo query-string-free so it
  // exact-matches Supabase's Redirect URLs allowlist entry).
  const next = searchParams.get('next') || '/account';

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const response = NextResponse.redirect(`${origin}${next}`);
      const optedIn = request.headers.get('cookie')?.includes(`${NEWSLETTER_OPTIN_COOKIE}=1`);
      const email = data.user?.email;
      if (optedIn && email) {
        // A failed subscribe mustn't fail the sign-in, so it's only logged.
        try {
          await createNewsletterSubscriber(email.toLowerCase());
        } catch (err) {
          console.error('Newsletter opt-in at sign-in failed:', (err as Error).message);
        }
      }
      response.cookies.delete(NEWSLETTER_OPTIN_COOKIE);
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=auth`);
}
