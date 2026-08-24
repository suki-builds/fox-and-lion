import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Refreshes the Supabase session cookie on every matched request. Session
// tokens expire; without this, a signed-in user's cookie would silently go
// stale and requests to Server Components/Actions would see them as
// logged out even though their browser still holds an old cookie.
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not add code between createServerClient and getUser() - anything in
  // between can race with a token refresh and log the user out randomly.
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  // Excludes static assets (favicon/_next) and everything under /api/ -
  // none of the existing API routes (submit-pitch, submit-contact,
  // revalidate, search-index) are session-aware, so there's no reason for
  // them to pay for a Supabase auth round-trip on every request.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
