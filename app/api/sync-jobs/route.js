import { NextResponse } from 'next/server';
import { COMPANIES, fetchAllAtsJobsForSync, jobToAtsJobRow } from '../../../lib/ats';
import { createAdminClient } from '../../../lib/supabase/admin';

// Triggered once a day by Vercel Cron (see vercel.json) - refetches every
// configured ATS company's job board and replaces its rows in the ats_jobs
// Supabase table. Page requests (getAllJobs()/getJobDetail() in lib/ats.js)
// never call the ATS APIs directly; they just read whatever this route last
// wrote, which is what keeps /careers and the homepage fast regardless of
// how many companies are configured.
//
// Vercel automatically sends `Authorization: Bearer $CRON_SECRET` when
// invoking a cron job, as long as the CRON_SECRET env var is set on the
// project - see README.md for the exact setup. The `?secret=` fallback
// exists purely so this can be triggered manually (curl, browser) for
// testing, the same way app/api/revalidate/route.js supports a manual
// trigger.
function isAuthorized(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  if (request.headers.get('authorization') === `Bearer ${secret}`) return true;
  const url = new URL(request.url);
  return url.searchParams.get('secret') === secret;
}

export async function GET(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ synced: false, message: 'Unauthorized' }, { status: 401 });
  }

  const results = await fetchAllAtsJobsForSync();
  const supabase = createAdminClient();
  const summary = [];

  // Sequential, not Promise.all - these are all writes to the same table
  // and there's no user waiting on this response, so there's nothing to
  // gain from parallelizing the Supabase calls (the slow part, hitting 12+
  // external ATS APIs, already happened concurrently inside
  // fetchAllAtsJobsForSync). Keeping it sequential also means a mistake in
  // one company's delete/insert pair can't race another's.
  for (const result of results) {
    if (result.status === 'rejected') {
      console.warn(`ATS sync failed for ${result.slug}:`, result.reason);
      summary.push({ slug: result.slug, ok: false, error: result.reason });
      continue;
    }

    const { error: deleteError } = await supabase.from('ats_jobs').delete().eq('company_slug', result.slug);
    if (deleteError) {
      summary.push({ slug: result.slug, ok: false, error: deleteError.message });
      continue;
    }

    const rows = result.jobs.map(jobToAtsJobRow);
    if (rows.length > 0) {
      const { error: insertError } = await supabase.from('ats_jobs').insert(rows);
      if (insertError) {
        summary.push({ slug: result.slug, ok: false, error: insertError.message });
        continue;
      }
    }

    summary.push({ slug: result.slug, ok: true, count: rows.length });
  }

  return NextResponse.json({ synced: true, companies: COMPANIES.length, summary });
}
