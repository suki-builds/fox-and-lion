import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// For use in Server Components, Server Actions, and Route Handlers - reads
// the session from the incoming request's cookies via next/headers. Server
// Components can't set cookies (the `setAll` write will throw there), so
// that's wrapped in a try/catch; session refresh is expected to happen in
// middleware instead when this is called from a Server Component.
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component - ignored, since middleware
            // handles refreshing the session cookie instead.
          }
        },
      },
    }
  );
}
