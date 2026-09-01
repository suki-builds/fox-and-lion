import Image from 'next/image';
import { PrismicRichText } from '@prismicio/react';
import { asText } from '@prismicio/client';
import { getAnalysisList, getAnalysisBySlug } from '../../../../lib/prismic';
import { buildMetadata } from '../../../../lib/seo';
import IllustrationPlaceholder from '../../../../components/IllustrationPlaceholder';
import YouTubeEmbed from '../../../../components/YouTubeEmbed';
import { coverImageSrc } from '../../../../lib/prismicImage';
import { effectivePublishedAt } from '../../../../lib/publishedDate';
import { extractYouTubeId } from '../../../../lib/youtube';
import { sharedRichTextComponents } from '../../../../lib/richTextComponents';
import ShareButton from '../../../../components/ShareButton';

export const revalidate = 3600;

export async function generateStaticParams() {
  const posts = await getAnalysisList();
  return posts.map((post) => ({ slug: post.uid }));
}

export async function generateMetadata({ params }) {
  const post = await getAnalysisBySlug(params.slug);
  if (!post) return { title: 'Analysis — Fox and Lion' };

  return buildMetadata({
    data: post.data,
    fallbackTitle: `${post.data.title} — Fox and Lion`,
    fallbackDescription: asText(post.data.excerpt),
  });
}

const bodyComponents = {
  ...sharedRichTextComponents,
  image: ({ node }) => (
    <figure className="article-body__image">
      <Image
        src={node.url}
        alt={node.alt || ''}
        width={node.dimensions.width}
        height={node.dimensions.height}
        sizes="(max-width: 680px) 100vw, 680px"
        style={{ width: '100%', height: 'auto' }}
      />
      {node.copyright && <figcaption>{node.copyright}</figcaption>}
    </figure>
  ),
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

export default async function AnalysisDetailPage({ params }) {
  const post = await getAnalysisBySlug(params.slug);

  if (!post) {
    return (
      <div className="container" style={{ paddingTop: '2.5rem' }}>
        <h1>Not found</h1>
        <p>This article does not exist or has been unpublished.</p>
      </div>
    );
  }

  const formattedDate = new Date(effectivePublishedAt(post)).toLocaleDateString(
    'en-GB',
    { day: 'numeric', month: 'long', year: 'numeric' }
  );

  return (
    <article>
      <section className="hero">
        <div className="hero__media">
          {post.data.cover_image?.url ? (
            <Image
              src={coverImageSrc(post.data.cover_image.url)}
              alt={post.data.cover_image.alt || ''}
              fill
              sizes="(max-width: 900px) 100vw, 1200px"
              priority
            />
          ) : (
            <IllustrationPlaceholder />
          )}
        </div>
        <div className="hero__copy">
          <span className="category-tag">{post.data.category || 'Analysis'}</span>
          <h1>{post.data.title}</h1>
          <div className="hero__eyebrow">
            <PrismicRichText field={post.data.excerpt} />
          </div>
        </div>
      </section>

      <div className="container">
        <div className="article-meta">
          {post.data.author && (
            <div className="article-meta__block">
              <span className="article-meta__label">Author</span>
              <span className="article-meta__value">{post.data.author}</span>
            </div>
          )}
          <div className="article-meta__block">
            <span className="article-meta__label">Date</span>
            <span className="article-meta__value">{formattedDate}</span>
          </div>
        </div>

        <div className="article-body">
          <PrismicRichText field={post.data.body} components={bodyComponents} />
        </div>

        <ShareButton title={post.data.title} />
      </div>
    </article>
  );
}
