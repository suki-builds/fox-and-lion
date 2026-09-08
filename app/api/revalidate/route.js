import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { getPrismicClient } from '../../../lib/prismic';
import { storeThumbnail } from '../../../lib/newsThumbnails';

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
// Resolves the webhook's raw document IDs to their type/uid, then for each
// changed document revalidates that one page and fetches it so the new HTML
// is built immediately rather than on whoever happens to visit next.
//
// This used to be paired with pattern-wide calls - revalidatePath('/news/
// [slug]', 'page') and friends - which marked *every* page of that route
// stale on *every* publish: 355 news pages, 16 analysis, 497 careers, for
// one edited post. Each of those then cost a regeneration the next time
// anything requested it. Revalidating the specific path instead keeps the
// blast radius at the one document that actually changed.
//
// Best-effort throughout: any lookup/fetch failure is logged and swallowed,
// never blocking the 200 the Prismic webhook is waiting on. The revalidate
// windows on the detail routes are the backstop if this misses something.
async function revalidateChangedDocuments(documentIds, origin) {
  if (!Array.isArray(documentIds) || documentIds.length === 0) return { paths: [], types: [] };
  const client = getPrismicClient();
  const paths = [];
  const types = [];

  await Promise.all(
    documentIds.map(async (id) => {
      try {
        const doc = await client.getByID(id);
        types.push(doc.type);
        const buildPath = DETAIL_PATH_BY_TYPE[doc.type];
        if (!buildPath) return;
        const path = buildPath(doc.uid);
        if (doc.type === 'news_post' && doc.data.source_url) {
          // Best-effort - see lib/newsThumbnails.js. A failure here just
          // means the thumbnail falls back to a live, self-healing scrape
          // on the next page read instead of blocking the webhook.
          await storeThumbnail(doc.uid, doc.data.source_url).catch((err) => {
            console.error(`Failed to scrape thumbnail for ${doc.uid}:`, err.message);
          });
        }
        revalidatePath(path);
        paths.push(path);
        await fetch(`${origin}${path}`, { cache: 'no-store' });
      } catch (err) {
        // err.message only - the Prismic client attaches its full request
        // URL (including the access_token query param) to some of its own
        // errors, and logging the whole object would leak that token into
        // Vercel's log stream.
        console.error(`Failed to revalidate changed document ${id}:`, err.message);
      }
    })
  );

  return { paths, types };
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

  // The list/aggregate pages genuinely can change on any publish (a new
  // post appears, an old one drops off the fold), and there are only a
  // handful of them, so these stay unconditional.
  const paths = ['/', '/analysis', '/news', '/careers', '/api/search-index'];
  paths.forEach((path) => revalidatePath(path));

  const { paths: detailPaths, types } = await revalidateChangedDocuments(
    body?.documents,
    new URL(request.url).origin
  );
  paths.push(...detailPaths);

  // Manual job postings are Prismic careers_post documents, but their URL
  // is /careers/<company-slug>/<uid> where the slug is derived from the
  // company name inside lib/ats.js - not reconstructable here without
  // reaching into that module's internals. So this one still goes wide,
  // but only when a careers_post is actually among the changed documents
  // rather than on every news publish as it did before.
  if (types.includes('careers_post')) {
    revalidatePath('/careers/[company]/[id]', 'page');
    paths.push('/careers/[company]/[id]');
  }
  // getAllJobs() in lib/ats.js reads manual postings live from Prismic on
  // every call (no cache of its own to bust) and ATS-sourced jobs from the
  // ats_jobs Supabase table (kept fresh by the separate cron-triggered
  // app/api/sync-jobs route, not by this webhook) - so revalidatePath('/careers')
  // above is already sufficient here.

  return NextResponse.json({ revalidated: true, paths });
}

export async function GET() {
  return NextResponse.json(
    { ok: true, message: 'POST only — this endpoint is for the Prismic webhook, see README.md.' },
    { status: 200 }
  );
}
