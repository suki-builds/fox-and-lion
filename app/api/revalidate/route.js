import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

// On-demand ISR revalidation, triggered by a single Prismic webhook
// (Settings > Webhooks) pointed at this route — see README.md for exact
// webhook configuration.
//
// Unlike DatoCMS, Prismic doesn't support scoping a webhook to a specific
// page type, and its secret is delivered as a `secret` field in the JSON
// body rather than a custom header. So this revalidates both Analysis and
// News every time, regardless of which one actually changed - harmless
// (revalidatePath is cheap) and correct, just slightly broader than the
// old per-type design DatoCMS allowed.
//
// Prismic's `documents` field is an array of page IDs, not full documents,
// so there's no uid available here without a follow-up API call (which
// this deliberately doesn't make) - every path below is revalidated by
// pattern rather than by specific slug.
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

  const paths = ['/', '/analysis', '/analysis/[slug]', '/news', '/news/[slug]', '/api/search-index'];
  revalidatePath('/');
  revalidatePath('/analysis');
  revalidatePath('/analysis/[slug]', 'page');
  revalidatePath('/news');
  revalidatePath('/news/[slug]', 'page');
  revalidatePath('/api/search-index');

  return NextResponse.json({ revalidated: true, paths });
}

export async function GET() {
  return NextResponse.json(
    { ok: true, message: 'POST only — this endpoint is for the Prismic webhook, see README.md.' },
    { status: 200 }
  );
}
