const DATOCMS_HOST = 'www.datocms-assets.com';

// Params worth carrying through to the proxy - anything else Dato may have
// added to a URL (e.g. `auto`) is dropped; see app/api/image-proxy/route.js
// for why `auto` specifically isn't forwarded.
const FORWARDED_PARAMS = ['w', 'h', 'fit', 'q', 'dpr'];

// Rewrites a raw datocms-assets.com URL into a same-origin, root-relative
// proxy URL (see app/api/image-proxy/route.js), so the asset is served from
// our own domain instead of exposing Dato's CDN host directly in rendered
// HTML. Root-relative (not absolute) so this resolves correctly against
// whichever origin actually serves the page - localhost, a Vercel preview
// deployment, or production - without needing a hardcoded site URL here.
// Anything that isn't a datocms-assets.com URL (external og:image scrapes,
// YouTube thumbnails, our own /public files) is returned unchanged.
export function proxiedImageUrl(url) {
  if (!url) return url;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  if (parsed.hostname !== DATOCMS_HOST) return url;

  const path = parsed.pathname.replace(/^\/+/, '');
  const params = new URLSearchParams();
  params.set('path', path);
  for (const key of FORWARDED_PARAMS) {
    const value = parsed.searchParams.get(key);
    if (value) params.set(key, value);
  }
  return `/api/image-proxy?${params.toString()}`;
}

// Rewrites every URL inside an HTML5 srcset string (comma-separated
// "url descriptor" pairs) - used for react-datocms's responsiveImage
// srcSet/webpSrcSet fields, which each bundle several width/DPR variants.
export function proxiedSrcSet(srcSet) {
  if (!srcSet) return srcSet;
  return srcSet
    .split(',')
    .map((entry) => {
      const [url, descriptor] = entry.trim().split(/\s+/);
      return [proxiedImageUrl(url), descriptor].filter(Boolean).join(' ');
    })
    .join(', ');
}
