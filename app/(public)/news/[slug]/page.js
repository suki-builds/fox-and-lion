import { PrismicRichText } from '@prismicio/react';
import { getNewsList, getNewsBySlug } from '../../../../lib/prismic';
import { buildMetadata } from '../../../../lib/seo';
import { getPageMeta } from '../../../../lib/ogImage';
import { resolveSourceName } from '../../../../lib/format';
import { effectivePublishedAt, isArchived } from '../../../../lib/publishedDate';
import { extractYouTubeId } from '../../../../lib/youtube';
import YouTubeEmbed from '../../../../components/YouTubeEmbed';
import { sharedRichTextComponents } from '../../../../lib/richTextComponents';
import ShareButton from '../../../../components/ShareButton';
import PostEngagement from '../../../../components/PostEngagement';
import ViewTracker from '../../../../components/ViewTracker';
import CommentThread from '../../../../components/CommentThread';

export const revalidate = 3600;

export async function generateStaticParams() {
  const posts = await getNewsList();
  return posts.map((post) => ({ slug: post.uid }));
}

export async function generateMetadata({ params }) {
  const post = await getNewsBySlug(params.slug);
  if (!post) return { title: 'News — Fox and Lion' };

  // News has no cover_image field, so buildMetadata's usual meta_image ->
  // cover_image fallback has nothing to land on - give it the same
  // source-article/YouTube thumbnail the page body itself displays,
  // rather than shipping a social card with no image.
  const youtubeId = post.data.source_url ? extractYouTubeId(post.data.source_url) : null;
  const meta = !youtubeId && post.data.source_url ? await getPageMeta(post.data.source_url) : null;
  const fallbackImage = youtubeId
    ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`
    : meta?.image || undefined;

  return buildMetadata({
    data: post.data,
    fallbackTitle: `${post.data.title} — Fox and Lion`,
    fallbackImage,
  });
}

export default async function NewsDetailPage({ params }) {
  const post = await getNewsBySlug(params.slug);

  if (!post) {
    return (
      <div className="container" style={{ paddingTop: '2.5rem' }}>
        <h1>Not found</h1>
        <p>This item does not exist or has been unpublished.</p>
      </div>
    );
  }

  const formattedDate = new Date(effectivePublishedAt(post)).toLocaleDateString(
    'en-GB',
    { day: 'numeric', month: 'long', year: 'numeric' }
  );
  const archived = isArchived(post);
  const meta = post.data.source_url ? await getPageMeta(post.data.source_url) : null;
  const thumbnail = meta?.image;
  const sourceName = post.data.source_url ? resolveSourceName(meta?.siteName, post.data.source_url) : null;
  const youtubeId = post.data.source_url ? extractYouTubeId(post.data.source_url) : null;
  // YouTube's own watch-page og:image sits far past getPageMeta's 100KB
  // read cap (YouTube front-loads a huge amount of inline JS/config before
  // its <meta> tags), so meta.image comes back empty for these — derive the
  // thumbnail directly from the video ID instead via YouTube's stable
  // thumbnail CDN, no page fetch needed at all. hqdefault is used (not
  // maxresdefault) since it's guaranteed to exist for every video.
  const youtubeThumbnail = youtubeId
    ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`
    : null;

  return (
    <article className="container" style={{ paddingTop: '2.5rem' }}>
      {post.data.source_url ? (
        <a
          href={post.data.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="news-detail__title-link"
        >
          <h1>{post.data.title}</h1>
        </a>
      ) : (
        <h1>{post.data.title}</h1>
      )}

      {youtubeId ? (
        <YouTubeEmbed videoId={youtubeId} thumbnail={youtubeThumbnail} title={post.data.title} />
      ) : (
        thumbnail && (
          <a
            href={post.data.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="news-detail__image"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumbnail} alt="" />
          </a>
        )
      )}

      <div className="article-meta">
        <div className="article-meta__block">
          <span className="article-meta__label">Date</span>
          <span className="article-meta__value">{formattedDate}</span>
        </div>
        <div className="article-meta__block">
          <span className="article-meta__label">Source</span>
          <span className="article-meta__value">
            <a href={post.data.source_url} target="_blank" rel="noopener noreferrer">
              {sourceName || post.data.source_url}
            </a>
          </span>
        </div>
        <div className="article-meta__block">
          <PostEngagement postUid={post.uid} postType="news" archived={archived} />
        </div>
      </div>
      <ViewTracker postUid={post.uid} postType="news" />

      <div className="article-body">
        <PrismicRichText field={post.data.commentary} components={sharedRichTextComponents} />
      </div>

      <ShareButton title={post.data.title} />

      <CommentThread postUid={post.uid} postType="news" archived={archived} />
    </article>
  );
}
