import { NextResponse } from 'next/server';
import { getPageMeta } from '../../../lib/ogImage';
import { resolveSourceName } from '../../../lib/format';

const MAX_ITEMS = 40;

// Lazily fetches og:image/site-name for a batch of News posts, called by
// NewsListClient's "Load more" instead of app/(public)/news/page.js
// eagerly scraping every post ever published on every regeneration. Each
// URL is still cached 24h via getPageMeta's own unstable_cache, so this is
// cheap on repeat calls across different visitors/sessions - it only ever
// pays the live-scrape cost the first time a given source URL is asked for.
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const items = Array.isArray(body?.items) ? body.items : null;
  if (!items) {
    return NextResponse.json({ error: '"items" must be an array.' }, { status: 400 });
  }
  if (items.length > MAX_ITEMS) {
    return NextResponse.json({ error: `Up to ${MAX_ITEMS} items per request.` }, { status: 400 });
  }

  const metas = await Promise.all(
    items.map((item) => (item?.sourceUrl ? getPageMeta(item.sourceUrl) : { image: null, siteName: null }))
  );

  const result = items.map((item, index) => ({
    uid: item.uid,
    sourceName: resolveSourceName(metas[index]?.siteName, item.sourceUrl),
    coverImageUrl: metas[index]?.image || null,
  }));

  return NextResponse.json({ items: result });
}
