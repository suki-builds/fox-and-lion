import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

// On-demand ISR revalidation, triggered by DatoCMS webhooks.
//
// Set up one webhook per content model in DatoCMS (Settings > Webhooks),
// each pointed at this route with a different `type` query param — see
// README.md for exact webhook configuration.
//
// We don't rely on parsing DatoCMS's webhook payload to figure out which
// model changed — the `type` query param (set per-webhook) already tells
// us that, which sidesteps any uncertainty about the payload's exact
// shape. We *do* try to pull the slug out of the payload for a precise,
// single-page revalidation; if that fails for any reason (unexpected
// payload shape, a delete event with no slug, etc.) we fall back to
// revalidating the whole list + the dynamic route pattern, which is
// always correct, just slightly broader than necessary.
const ROUTES_BY_TYPE = {
  analysis: { list: '/analysis', detailPattern: '/analysis/[slug]', detailPrefix: '/analysis' },
  news: { list: '/news', detailPattern: '/news/[slug]', detailPrefix: '/news' },
};

function extractSlug(body) {
  return body?.entity?.attributes?.slug || body?.slug || null;
}

export async function POST(request) {
  const secret = request.headers.get('x-revalidate-secret');
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ revalidated: false, message: 'Invalid or missing secret' }, { status: 401 });
  }

  const type = new URL(request.url).searchParams.get('type');
  const routes = ROUTES_BY_TYPE[type];
  if (!routes) {
    return NextResponse.json(
      { revalidated: false, message: `Unknown or missing "type" query param. Expected one of: ${Object.keys(ROUTES_BY_TYPE).join(', ')}` },
      { status: 400 }
    );
  }

  let body = null;
  try {
    body = await request.json();
  } catch {
    // DatoCMS always sends a JSON body, but don't fail the revalidation
    // over a body we can't parse — the list + homepage revalidation below
    // doesn't depend on it.
  }

  const paths = ['/', routes.list, '/api/search-index'];
  revalidatePath('/');
  revalidatePath(routes.list);
  // Both Analysis and News webhooks touch this — the search index spans
  // all content types, so any change to either should refresh it.
  revalidatePath('/api/search-index');

  const slug = extractSlug(body);
  if (slug) {
    const detailPath = `${routes.detailPrefix}/${slug}`;
    revalidatePath(detailPath);
    paths.push(detailPath);
  } else {
    revalidatePath(routes.detailPattern, 'page');
    paths.push(routes.detailPattern);
  }

  return NextResponse.json({ revalidated: true, type, paths });
}

export async function GET() {
  return NextResponse.json(
    { ok: true, message: 'POST only — this endpoint is for DatoCMS webhooks, see README.md.' },
    { status: 200 }
  );
}
