import { isFilled } from '@prismicio/client';
import { socialImageSrc } from './prismicImage';

// Builds a Next.js Metadata object from a Prismic document's SEO &
// Metadata tab (meta_title/meta_description/meta_image, built into
// Prismic's page type) plus our own custom seo_twitter_card/seo_no_index
// fields (Prismic has no built-in equivalent for those), falling back to
// page-specific defaults when an editor hasn't filled them in. Pass the
// document's `data` object directly. `fallbackImage` is a plain URL (not
// a Prismic image field) for callers that have their own last-resort
// image - e.g. News posts, which have no cover_image field and instead
// fall back to a thumbnail scraped from the source article/YouTube.
export function buildMetadata({ data, fallbackTitle, fallbackDescription, fallbackImage }) {
  const title = data?.meta_title || fallbackTitle;
  const description = data?.meta_description || fallbackDescription || undefined;

  // meta_image lets editors pick a crop/image specifically for social
  // sharing; most documents won't bother, so fall back to cover_image
  // (analysis_post only - news_post has no cover_image field), then to
  // fallbackImage, rather than shipping a share preview with no image at
  // all. cover_image is displayed on-page at its own native aspect ratio
  // (see lib/prismicImage.js's coverImageSrc) rather than Open Graph's
  // expected 1200x630, so it's run through socialImageSrc()'s fixed crop
  // here instead. fallbackImage is left untouched instead - it's an
  // arbitrary external URL (not hosted on Prismic), so it can't be run
  // through that same crop, and it may be a signed URL that a stray query
  // param would invalidate.
  let imageUrl;
  let imageWidth;
  let imageHeight;
  let imageAlt;
  if (isFilled.image(data?.meta_image)) {
    // Root-relative - resolved to an absolute URL against metadataBase (see
    // app/layout.js) since og:image/twitter:image require a fully-qualified
    // URL.
    imageUrl = data.meta_image.url;
    imageWidth = data.meta_image.dimensions?.width;
    imageHeight = data.meta_image.dimensions?.height;
    imageAlt = data.meta_image.alt || title;
  } else if (isFilled.image(data?.cover_image)) {
    imageUrl = socialImageSrc(data.cover_image.url);
    imageWidth = 1200;
    imageHeight = 630;
    imageAlt = data.cover_image.alt || title;
  } else if (fallbackImage) {
    imageUrl = fallbackImage;
    imageAlt = title;
  }

  return {
    title,
    description,
    robots: data?.seo_no_index ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description,
      images: imageUrl
        ? [{ url: imageUrl, width: imageWidth, height: imageHeight, alt: imageAlt }]
        : undefined,
    },
    twitter: {
      card: data?.seo_twitter_card || (imageUrl ? 'summary_large_image' : 'summary'),
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}
