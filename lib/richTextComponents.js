import YouTubeEmbed from '../components/YouTubeEmbed';
import { extractYouTubeId } from './youtube';

// Shared PrismicRichText serializer overrides, reused by both Analysis
// Post's body and News Post's commentary (see the two [slug]/page.js
// files) so any field using these renders consistently.
//
// heading6 is repurposed as a caption/supplementary-note style rather
// than an actual heading - editors get a normal-looking heading option
// in Prismic's rich text toolbar, but it renders as a <p>, not an <h6>,
// so it doesn't distort the document's heading outline for SEO/screen
// readers. See .article-body__caption in globals.css for the styling.
//
// heading5 is repurposed as a plain section divider - its text content
// is ignored (editors leave it blank or type a placeholder like "---")
// and it renders as an <hr>. See .article-body__divider in globals.css.
export const sharedRichTextComponents = {
  heading5: () => <hr className="article-body__divider" />,
  heading6: ({ children }) => <p className="article-body__caption">{children}</p>,

  // Videos live here rather than in the Analysis page's own overrides,
  // where this used to sit. News commentary got PrismicRichText's default
  // embed rendering instead, which prints the provider's raw oEmbed HTML -
  // and YouTube's payload carries fixed width/height attributes, 200x113
  // for the one News post using it. Nothing stretched that back out, so the
  // same video that filled the column on an Analysis post rendered as a
  // thumbnail-sized player on a News post. Sharing the override means both
  // get the click-to-play component at the column's full width, and any
  // field using this serializer keeps behaving the same way in future.
  embed: ({ node }) => {
    const embed = node.oembed;
    // Prismic already extracts the video ID via oEmbed when the URL was
    // pasted (embed_url) - extractYouTubeId(embed_url) is only a fallback
    // in case provider_name isn't recognized as YouTube by string match.
    const videoId = extractYouTubeId(embed.embed_url);
    if ((embed.provider_name || '').toLowerCase() === 'youtube' && videoId) {
      return (
        <div className="article-body__video">
          <YouTubeEmbed videoId={videoId} thumbnail={embed.thumbnail_url} title={embed.title} />
        </div>
      );
    }
    // Non-YouTube providers (e.g. Vimeo) fall back to a plain link rather
    // than silently dropping the block.
    return (
      <p className="article-body__video-fallback">
        <a href={embed.embed_url} target="_blank" rel="noopener noreferrer">
          {embed.title || embed.embed_url}
        </a>
      </p>
    );
  },
};
