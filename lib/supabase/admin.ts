import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Service-role client - bypasses Row Level Security entirely. Used by the
// cron-triggered sync route (app/api/sync-jobs/route.js) to write ats_jobs,
// and by lib/newsThumbnails.js to write news_post_thumbnails (from the
// Prismic publish webhook and, as a self-healing fallback, from Server
// Component render paths) - never import this into anything that writes
// based on arbitrary client/user input. Requires SUPABASE_SERVICE_ROLE_KEY,
// found in the Supabase dashboard under Project Settings > API - kept
// separate from the public anon key everything else in this app uses, and
// never exposed to the browser (no NEXT_PUBLIC_ prefix).
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must both be set');
  }
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
