// Builds a Next.js Metadata object from a DatoCMS SeoField, falling back to
// page-specific defaults when an editor hasn't filled in the SEO field.
export function buildMetadata({ seoTags, fallbackTitle, fallbackDescription }) {
  const title = seoTags?.title || fallbackTitle;
  const description = seoTags?.description || fallbackDescription || undefined;
  const image = seoTags?.image;

  return {
    title,
    description,
    robots: seoTags?.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description,
      images: image
        ? [{ url: image.url, width: image.width, height: image.height, alt: image.alt || title }]
        : undefined,
    },
    twitter: {
      card: seoTags?.twitterCard || (image ? 'summary_large_image' : 'summary'),
      title,
      description,
      images: image ? [image.url] : undefined,
    },
  };
}
