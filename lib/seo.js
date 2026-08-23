// Builds a Next.js Metadata object from a Prismic document's flat
// seo_title/seo_description/seo_twitter_card/seo_no_index/seo_image
// fields, falling back to page-specific defaults when an editor hasn't
// filled them in. Pass the document's `data` object directly.
export function buildMetadata({ data, fallbackTitle, fallbackDescription }) {
  const title = data?.seo_title || fallbackTitle;
  const description = data?.seo_description || fallbackDescription || undefined;
  const image = data?.seo_image;
  // Root-relative - resolved to an absolute URL against metadataBase (see
  // app/layout.js) since og:image/twitter:image require a fully-qualified
  // URL.
  const imageUrl = image?.url || undefined;

  return {
    title,
    description,
    robots: data?.seo_no_index ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description,
      images: image
        ? [{ url: imageUrl, width: image.dimensions?.width, height: image.dimensions?.height, alt: image.alt || title }]
        : undefined,
    },
    twitter: {
      card: data?.seo_twitter_card || (image ? 'summary_large_image' : 'summary'),
      title,
      description,
      images: image ? [imageUrl] : undefined,
    },
  };
}
