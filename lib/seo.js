import { proxiedImageUrl } from './imageProxy';

// Builds a Next.js Metadata object from a DatoCMS SeoField, falling back to
// page-specific defaults when an editor hasn't filled in the SEO field.
export function buildMetadata({ seoTags, fallbackTitle, fallbackDescription }) {
  const title = seoTags?.title || fallbackTitle;
  const description = seoTags?.description || fallbackDescription || undefined;
  const image = seoTags?.image;
  // Root-relative - resolved to an absolute URL against metadataBase (see
  // app/layout.js) since og:image/twitter:image require a fully-qualified
  // URL. Also keeps the raw datocms-assets.com host out of rendered HTML.
  const imageUrl = image ? proxiedImageUrl(image.url) : undefined;

  return {
    title,
    description,
    robots: seoTags?.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description,
      images: image
        ? [{ url: imageUrl, width: image.width, height: image.height, alt: image.alt || title }]
        : undefined,
    },
    twitter: {
      card: seoTags?.twitterCard || (image ? 'summary_large_image' : 'summary'),
      title,
      description,
      images: image ? [imageUrl] : undefined,
    },
  };
}
