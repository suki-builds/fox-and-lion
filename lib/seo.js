import { isFilled } from '@prismicio/client';
import { coverImageSrc } from './prismicImage';

// Builds a Next.js Metadata object from a Prismic document's SEO &
// Metadata tab (meta_title/meta_description/meta_image, built into
// Prismic's page type) plus our own custom seo_twitter_card/seo_no_index
// fields (Prismic has no built-in equivalent for those), falling back to
// page-specific defaults when an editor hasn't filled them in. Pass the
// document's `data` object directly.
export function buildMetadata({ data, fallbackTitle, fallbackDescription }) {
  const title = data?.meta_title || fallbackTitle;
  const description = data?.meta_description || fallbackDescription || undefined;

  // meta_image lets editors pick a crop/image specifically for social
  // sharing; most documents won't bother, so fall back to cover_image
  // (analysis_post only - news_post has no cover_image field) rather than
  // shipping a share preview with no image at all. cover_image wasn't
  // necessarily cropped with Open Graph's 1200x630 in mind, so it's run
  // through the same imgix crop used for the hero image instead of being
  // passed through raw.
  let image;
  let imageUrl;
  let imageWidth;
  let imageHeight;
  if (isFilled.image(data?.meta_image)) {
    image = data.meta_image;
    // Root-relative - resolved to an absolute URL against metadataBase (see
    // app/layout.js) since og:image/twitter:image require a fully-qualified
    // URL.
    imageUrl = image.url;
    imageWidth = image.dimensions?.width;
    imageHeight = image.dimensions?.height;
  } else if (isFilled.image(data?.cover_image)) {
    image = data.cover_image;
    imageUrl = coverImageSrc(image.url, { w: 1200, h: 630 });
    imageWidth = 1200;
    imageHeight = 630;
  }

  return {
    title,
    description,
    robots: data?.seo_no_index ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description,
      images: image
        ? [{ url: imageUrl, width: imageWidth, height: imageHeight, alt: image.alt || title }]
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
