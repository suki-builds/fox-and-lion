import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Anon-key client with no cookie/session handling at all - deliberately not
// built on @supabase/ssr's createServerClient, which reads cookies() from
// next/headers. Calling cookies() ANYWHERE in a Server Component's render
// path forces that whole page to opt out of static/ISR rendering in
// Next.js, even for an anonymous visitor where the cookie read finds
// nothing - which is exactly what silently turned "/", "/news", "/analysis"
// and "/careers" into fully dynamic, re-rendered-on-every-request pages
// once this started getting called from their render paths, burning far
// more Vercel Active CPU than the hourly ISR regeneration they're meant to
// get. Use this for any read that doesn't actually need to know who's
// asking - RLS still applies, so it's exactly as safe as the public anon
// key already is everywhere else in this app.
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must both be set');
  }
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
