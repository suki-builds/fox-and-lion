// Prismic's image URLs come with `auto=compress,format`. `compress` is a
// lossy pass that also turns PNGs into JPEGs server-side (next/image fetches
// without a webp/avif Accept header) - that smears text in charts, and
// next/image's own quality setting can't recover what's already been lost.
// Keeping just `format` returns the original asset, which next/image then
// encodes once. Use for anything handed to next/image.
export function uncompressedImageSrc(url) {
  if (!url) return url;
  const transformed = new URL(url);
  transformed.searchParams.set('auto', 'format');
  return transformed.toString();
}

// Requests a Prismic asset resized (not cropped) via its imgix-backed
// transform API - only a max width is set, so imgix scales height to
// match automatically and the asset's original aspect ratio is preserved.
// Use this for on-page display, where a cover image should show at
// whatever shape it was uploaded in rather than being force-fit into a
// fixed box. See socialImageSrc() below for the one place a fixed ratio
// is actually required.
//
// Passed straight to next/image as-is (see next.config.mjs's
// images.remotePatterns for images.prismic.io) - no proxy needed, since
// next/image itself is what keeps Prismic's origin from being hit on every
// pageview (see the bandwidth note in the migration plan).
export function coverImageSrc(url, { w = 1600 } = {}) {
  if (!url) return url;
  const transformed = new URL(uncompressedImageSrc(url));
  transformed.searchParams.set('w', String(w));
  return transformed.toString();
}

// Crops a Prismic asset to exactly 1200x630 - Open Graph's expected share
// image ratio - via the same transform API. fit=crop centers on the
// asset's stored focal point if an editor has set one in Prismic (defaults
// to dead center otherwise). Used only for og:image/twitter:image metadata
// (see lib/seo.js): social platforms render whatever ratio they're handed
// verbatim, with no equivalent of object-fit to fall back on, so that's
// the one spot a fixed crop is actually needed rather than just resizing.
export function socialImageSrc(url) {
  if (!url) return url;
  const transformed = new URL(url);
  transformed.searchParams.set('fit', 'crop');
  transformed.searchParams.set('w', '1200');
  transformed.searchParams.set('h', '630');
  return transformed.toString();
}

// Width/height ratio of a Prismic image field, for setting a container's
// CSS aspect-ratio inline so it matches the source image exactly (see
// coverImageSrc above - undefined when there's no image or Prismic hasn't
// recorded dimensions for it, letting callers fall back to a default box.
export function imageAspectRatio(image) {
  const dimensions = image?.dimensions;
  return dimensions ? dimensions.width / dimensions.height : undefined;
}
