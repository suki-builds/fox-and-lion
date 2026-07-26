import { StructuredText } from 'react-datocms';
import { fetchFromDato } from '../../../../lib/datocms';
import {
  ANALYSIS_LIST_QUERY,
  ANALYSIS_DETAIL_QUERY,
} from '../../../../lib/queries';

export const revalidate = 3600;

// Pre-builds a page for every existing Analysis post at build time.
// New posts published in DatoCMS after that will render on first request
// (Next.js "ISR" — incremental static regeneration) then get cached.
export async function generateStaticParams() {
  const data = await fetchFromDato(ANALYSIS_LIST_QUERY);
  return data.allAnalysisPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }) {
  const data = await fetchFromDato(ANALYSIS_DETAIL_QUERY, {
    slug: params.slug,
  });
  return { title: `${data.analysisPost?.title ?? 'Analysis'} — Fox and Lion` };
}

export default async function AnalysisDetailPage({ params }) {
  const data = await fetchFromDato(ANALYSIS_DETAIL_QUERY, {
    slug: params.slug,
  });
  const post = data.analysisPost;

  if (!post) {
    return (
      <div className="container">
        <h1>Not found</h1>
        <p>This article does not exist or has been unpublished.</p>
      </div>
    );
  }

  return (
    <article className="container">
      <span className="post-meta">
        {new Date(post.publishedDate).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
        {post.author ? ` · ${post.author}` : ''}
      </span>
      <h1>{post.title}</h1>
      {post.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.coverImage.url}
          alt={post.coverImage.alt || ''}
          style={{ width: '100%', height: 'auto', margin: '1.5rem 0' }}
        />
      )}
      <StructuredText data={post.body} />
    </article>
  );
}
