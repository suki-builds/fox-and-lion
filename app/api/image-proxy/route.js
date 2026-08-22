export const runtime = 'edge';

// This project's DatoCMS numeric ID (visible in every asset URL, e.g.
// https://www.datocms-assets.com/223331/...). Hardcoded and enforced below
// so this endpoint can only ever proxy assets belonging to our own DatoCMS
// project - not an open relay for an arbitrary datocms-assets.com path.
const DATOCMS_PROJECT_ID = '223331';
const DATOCMS_HOST = 'www.datocms-assets.com';

// Matches "<projectId>/<numeric-upload-id>-<slug>.<ext>", the actual shape
// of every asset path in this project (e.g.
// "223331/1787085724-targetsartboard-1-3x.png").
const PATH_PATTERN = new RegExp(
  `^${DATOCMS_PROJECT_ID}/[0-9]+-[a-z0-9-]+\\.(png|jpe?g|gif|webp|avif|svg)$`,
  'i'
);

// Only these imgix transform params are forwarded upstream - keeps the
// request (and the cache key) predictable. `auto` is deliberately excluded:
// this endpoint doesn't forward the real client's Accept header (doing so
// would require `Vary: Accept` on the response, which fragments the edge
// cache per browser and defeats the point of proxying at all - see the
// fm=webp override below), so auto=format couldn't content-negotiate
// anything meaningful anyway.
const FORWARDED_PARAMS = ['w', 'h', 'fit', 'q', 'dpr'];

const CACHE_CONTROL = 'public, max-age=31536000, immutable';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || '';

  if (!PATH_PATTERN.test(path)) {
    return new Response('Not found', { status: 404 });
  }

  const upstream = new URL(`https://${DATOCMS_HOST}/${path}`);
  for (const key of FORWARDED_PARAMS) {
    const value = searchParams.get(key);
    if (value) upstream.searchParams.set(key, value);
  }
  // Fixed format, not content-negotiated - see FORWARDED_PARAMS comment.
  // WebP has effectively universal browser support, so every request for
  // the same path+params produces byte-identical output: one cacheable
  // variant per URL, no Vary header needed.
  upstream.searchParams.set('fm', 'webp');

  let upstreamRes;
  try {
    upstreamRes = await fetch(upstream);
  } catch {
    return new Response('Upstream fetch failed', { status: 502 });
  }

  if (!upstreamRes.ok || !upstreamRes.body) {
    return new Response('Upstream error', { status: upstreamRes.status || 502 });
  }

  const headers = new Headers();
  headers.set('Content-Type', upstreamRes.headers.get('content-type') || 'image/webp');
  headers.set('Cache-Control', CACHE_CONTROL);
  headers.set('CDN-Cache-Control', CACHE_CONTROL);
  headers.set('Vercel-CDN-Cache-Control', CACHE_CONTROL);

  return new Response(upstreamRes.body, { status: 200, headers });
}
