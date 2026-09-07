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

  // Removing a company from COMPANIES used to orphan its rows rather than
  // clear them: the per-company delete below only ever touches slugs that
  // are still configured, so a de-listed company's jobs stayed in the table
  // and kept being served on /careers indefinitely. Anduril and Palantir
  // were excluded by request and left 2,521 stale rows behind - 84% of the
  // table, still on the public board with posted_at dates back to 2019, and
  // 2,521 extra links into the job detail route for crawlers to walk.
  // Pruning here means de-listing a company is enough on its own.
  const configuredSlugs = COMPANIES.map((c) => c.slug);
  if (configuredSlugs.length > 0) {
    const { error: pruneError, count: pruned } = await supabase
      .from('ats_jobs')
      .delete({ count: 'exact' })
      .not('company_slug', 'in', `(${configuredSlugs.join(',')})`);
    if (pruneError) {
      // Non-fatal: stale rows are a content/cost problem, not a correctness
      // one for the companies that are still configured below.
      console.warn('ats_jobs prune failed:', pruneError.message);
    } else if (pruned) {
      console.log(`Pruned ${pruned} ats_jobs rows for de-listed companies`);
    }
  }

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
