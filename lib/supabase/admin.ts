import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Service-role client - bypasses Row Level Security entirely. Only for the
// cron-triggered sync route (app/api/sync-jobs/route.js), which is the one
// place that needs to write ats_jobs; never import this into anything that
// handles a user-facing request. Requires SUPABASE_SERVICE_ROLE_KEY, found
// in the Supabase dashboard under Project Settings > API - kept separate
// from the public anon key everything else in this app uses, and never
// exposed to the browser (no NEXT_PUBLIC_ prefix).
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
