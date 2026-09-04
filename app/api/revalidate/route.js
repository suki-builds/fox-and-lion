import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { getPrismicClient } from '../../../lib/prismic';

const DETAIL_PATH_BY_TYPE = {
  analysis_post: (uid) => `/analysis/${uid}`,
  news_post: (uid) => `/news/${uid}`,
};

// revalidatePath only marks a page stale - the regenerated HTML isn't
// actually served until the next real request hits that exact URL. That's
// fine for "/" and the list pages (high traffic, get hit again within
// seconds), but a single News/Analysis post can go unvisited for a long
// time after an edit, leaving it stuck showing the old content (e.g. a
// swapped cover image) indefinitely. This resolves the webhook's raw
// document IDs to their UID/type and fetches each changed post's own page
// directly, forcing it to regenerate immediately instead of waiting on
// organic traffic. Best-effort: any lookup/fetch failure here is logged and
// swallowed, never blocks the 200 response the Prismic webhook is waiting on.
async function warmChangedDetailPages(documentIds, origin) {
  if (!Array.isArray(documentIds) || documentIds.length === 0) return;
  const client = getPrismicClient();
  await Promise.all(
    documentIds.map(async (id) => {
      try {
        const doc = await client.getByID(id);
        const buildPath = DETAIL_PATH_BY_TYPE[doc.type];
        if (!buildPath) return;
        await fetch(`${origin}${buildPath(doc.uid)}`, { cache: 'no-store' });
      } catch (err) {
        // err.message only - the Prismic client attaches its full request
        // URL (including the access_token query param) to some of its own
        // errors, and logging the whole object would leak that token into
        // Vercel's log stream.
        console.error(`Failed to warm page for changed document ${id}:`, err.message);
      }
    })
  );
}

// On-demand ISR revalidation, triggered by a single Prismic webhook
// (Settings > Webhooks) pointed at this route — see README.md for exact
// webhook configuration.
//
// Unlike DatoCMS, Prismic doesn't support scoping a webhook to a specific
// page type, and its secret is delivered as a `secret` field in the JSON
// body rather than a custom header. So this revalidates Analysis, News,
// and Careers every time, regardless of which one actually changed -
// harmless (revalidatePath is cheap) and correct, just slightly broader
// than the old per-type design DatoCMS allowed.
//
// Prismic's `documents` field is an array of page IDs, not full documents,
// so every path below is revalidated by pattern rather than by specific
// slug - warmChangedDetailPages above is what makes the follow-up API call
// to resolve those IDs, for the specific case (News/Analysis posts) where
// pattern-only revalidation isn't enough on its own.
export async function POST(request) {
  let body = null;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ revalidated: false, message: 'Invalid JSON body' }, { status: 400 });
  }

  if (!process.env.REVALIDATE_SECRET || body?.secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ revalidated: false, message: 'Invalid or missing secret' }, { status: 401 });
  }

  const paths = [
    '/',
    '/analysis',
    '/analysis/[slug]',
    '/news',
    '/news/[slug]',
    '/careers',
    '/careers/[company]/[id]',
    '/api/search-index',
  ];
  revalidatePath('/');
  revalidatePath('/analysis');
  revalidatePath('/analysis/[slug]', 'page');
  revalidatePath('/news');
  revalidatePath('/news/[slug]', 'page');
  revalidatePath('/careers');
  revalidatePath('/careers/[company]/[id]', 'page');
  revalidatePath('/api/search-index');
  // getAllJobs() in lib/ats.js is an unstable_cache entry, not a plain
  // fetch tied to this route — revalidatePath('/careers') alone won't
  // reliably bust it. revalidateTag is what actually forces it to refetch
  // (picking up a newly published/edited job_posting) instead of waiting
  // out its own 1-hour revalidate window.
  revalidateTag('fox-and-lion-jobs');

  await warmChangedDetailPages(body?.documents, new URL(request.url).origin);

  return NextResponse.json({ revalidated: true, paths });
}

export async function GET() {
  return NextResponse.json(
    { ok: true, message: 'POST only — this endpoint is for the Prismic webhook, see README.md.' },
    { status: 200 }
  );
}
