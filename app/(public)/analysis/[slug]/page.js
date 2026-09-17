import { cache } from 'react';
import Image from 'next/image';
import { PrismicRichText } from '@prismicio/react';
import { asText } from '@prismicio/client';
import { getAnalysisList, getAnalysisBySlug } from '../../../../lib/prismic';
import { buildMetadata } from '../../../../lib/seo';
import IllustrationPlaceholder from '../../../../components/IllustrationPlaceholder';
import { coverImageSrc, imageAspectRatio } from '../../../../lib/prismicImage';
import { effectivePublishedAt, isArchived } from '../../../../lib/publishedDate';
import { sharedRichTextComponents } from '../../../../lib/richTextComponents';
import ShareButton from '../../../../components/ShareButton';
import PostEngagement from '../../../../components/PostEngagement';
import ViewTracker from '../../../../components/ViewTracker';
import CommentThread from '../../../../components/CommentThread';

// Same reasoning as /news/[slug]: an analysis post changes only when it is
// republished, and app/api/revalidate/route.js handles that per-post from
// the Prismic webhook. Daily is a self-healing safety net, not the primary
// freshness mechanism.
export const revalidate = 86400;

// generateMetadata and the page body both need the same post; cache()
// makes that one Prismic round-trip per render instead of two.
const getPost = cache(getAnalysisBySlug);

export async function generateStaticParams() {
  const posts = await getAnalysisList();
  return posts.map((post) => ({ slug: post.uid }));
}

export async function generateMetadata({ params }) {
  const post = await getPost(params.slug);
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
        quality={90}
        style={{ width: '100%', height: 'auto' }}
      />
      {node.copyright && <figcaption>{node.copyright}</figcaption>}
    </figure>
  ),
  // `embed` now comes from sharedRichTextComponents, so News commentary
  // renders videos the same way this page always has.
};

export default async function AnalysisDetailPage({ params }) {
  const post = await getPost(params.slug);

  if (!post) {
    return (
      <div className="container" style={{ paddingTop: '2.5rem' }}>
        <h1>Not found</h1>
        <p>This article does not exist or has been unpublished.</p>
      </div>
    );
  }

  const archived = isArchived(post, 'analysis');

  const formattedDate = new Date(effectivePublishedAt(post)).toLocaleDateString(
    'en-GB',
    { day: 'numeric', month: 'long', year: 'numeric' }
  );

  return (
    <article>
      <section className="hero">
        <div
          className="hero__media"
          style={{ aspectRatio: imageAspectRatio(post.data.cover_image) }}
        >
          {post.data.cover_image?.url ? (
            <Image
              src={coverImageSrc(post.data.cover_image.url)}
              alt={post.data.cover_image.alt || ''}
              fill
              sizes="(max-width: 900px) 100vw, 1200px"
              quality={90}
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
          <div className="article-meta__block">
            <PostEngagement postUid={post.uid} postType="analysis" archived={archived} />
          </div>
          <div className="article-meta__block">
            <ShareButton postUid={post.uid} postType="analysis" compact />
          </div>
        </div>
        <ViewTracker postUid={post.uid} postType="analysis" />

        <div className="article-body">
          <PrismicRichText field={post.data.body} components={bodyComponents} />
        </div>

        <ShareButton postUid={post.uid} postType="analysis" />

        <CommentThread postUid={post.uid} postType="analysis" archived={archived} />
      </div>
    </article>
  );
}
