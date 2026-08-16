// Requests a DatoCMS asset pre-cropped to a fixed size via its imgix-backed
// transform API, rather than relying on CSS object-fit to crop a full-size
// image client-side. fit=crop with w/h automatically centers on the asset's
// stored focal point if an editor has set one in DatoCMS (defaults to dead
// center otherwise) - no fp-x/fp-y params needed here, so a focal point set
// later in the CMS is honored with no code change.
export function coverImageSrc(url, { w = 1200, h = 630 } = {}) {
  if (!url) return url;
  const transformed = new URL(url);
  transformed.searchParams.set('fit', 'crop');
  transformed.searchParams.set('w', String(w));
  transformed.searchParams.set('h', String(h));
  transformed.searchParams.set('auto', 'format');
  return transformed.toString();
}
