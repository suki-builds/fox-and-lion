import { StructuredText } from 'react-datocms';
import { fetchFromDato } from '../../../../lib/datocms';
import {
  ANALYSIS_LIST_QUERY,
  ANALYSIS_DETAIL_QUERY,
} from '../../../../lib/queries';
import { buildMetadata } from '../../../../lib/seo';
import { stripMarkdown } from '../../../../lib/markdown';
import IllustrationPlaceholder from '../../../../components/IllustrationPlaceholder';
import ExcerptMarkdown from '../../../../components/ExcerptMarkdown';
import YouTubeEmbed from '../../../../components/YouTubeEmbed';
import { coverImageSrc } from '../../../../lib/datocmsImage';
import { extractYouTubeId } from '../../../../lib/youtube';

export const revalidate = 3600;

export async function generateStaticParams() {
  const data = await fetchFromDato(ANALYSIS_LIST_QUERY);
  return data.allAnalysisPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }) {
  const data = await fetchFromDato(ANALYSIS_DETAIL_QUERY, {
    slug: params.slug,
  });
  const post = data.analysisPost;
  if (!post) return { title: 'Analysis — Fox and Lion' };

  return buildMetadata({
    seoTags: post.seoTags,
    fallbackTitle: `${post.title} — Fox and Lion`,
    fallbackDescription: stripMarkdown(post.excerpt),
  });
}

export default async function AnalysisDetailPage({ params }) {
  const data = await fetchFromDato(ANALYSIS_DETAIL_QUERY, {
    slug: params.slug,
  });
  const post = data.analysisPost;

  if (!post) {
    return (
      <div className="container" style={{ paddingTop: '2.5rem' }}>
        <h1>Not found</h1>
        <p>This article does not exist or has been unpublished.</p>
      </div>
    );
  }

  const formattedDate = new Date(post.publishedDate).toLocaleDateString(
    'en-GB',
    { day: 'numeric', month: 'long', year: 'numeric' }
  );

  return (
    <article>
      <section className="hero">
        <div className="hero__media">
          {post.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImageSrc(post.coverImage.url)}
              alt={post.coverImage.alt || ''}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <IllustrationPlaceholder />
          )}
        </div>
        <div className="hero__copy">
          <span className="category-tag">{post.category || 'Analysis'}</span>
          <h1>{post.title}</h1>
          <ExcerptMarkdown className="hero__eyebrow">{post.excerpt}</ExcerptMarkdown>
        </div>
      </section>

      <div className="container">
        <div className="article-meta">
          {post.author && (
            <div className="article-meta__block">
              <span className="article-meta__label">Author</span>
              <span className="article-meta__value">{post.author}</span>
            </div>
          )}
          <div className="article-meta__block">
            <span className="article-meta__label">Date</span>
            <span className="article-meta__value">{formattedDate}</span>
          </div>
        </div>

        <div className="article-body">
          <StructuredText
            data={post.body}
            renderBlock={({ record }) => {
              if (record.__typename === 'ImageBlockRecord' && record.asset) {
                return (
                  <figure className="article-body__image">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={record.asset.url}
                      alt={record.asset.alt || ''}
                      width={record.asset.width}
                      height={record.asset.height}
                    />
                    {record.asset.title && <figcaption>{record.asset.title}</figcaption>}
                  </figure>
                );
              }
              if (record.__typename === 'ExternalVideoRecord' && record.externalVideo) {
                const video = record.externalVideo;
                // providerUid is the bare video ID DatoCMS already extracted via
                // oEmbed when the URL was pasted - extractYouTubeId(url) is only
                // a fallback in case that's ever missing.
                const videoId = video.providerUid || extractYouTubeId(video.url);
                if (video.provider === 'youtube' && videoId) {
                  return (
                    <div className="article-body__video">
                      <YouTubeEmbed
                        videoId={videoId}
                        thumbnail={video.thumbnailUrl}
                        title={video.title}
                      />
                    </div>
                  );
                }
                // Non-YouTube providers (e.g. Vimeo) fall back to a plain link
                // rather than silently dropping the block.
                return (
                  <p className="article-body__video-fallback">
                    <a href={video.url} target="_blank" rel="noopener noreferrer">
                      {video.title || video.url}
                    </a>
                  </p>
                );
              }
              return null;
            }}
          />
        </div>
      </div>
    </article>
  );
}
