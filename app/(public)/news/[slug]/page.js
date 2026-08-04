import { StructuredText } from 'react-datocms';
import { fetchFromDato } from '../../../../lib/datocms';
import { NEWS_LIST_QUERY, NEWS_DETAIL_QUERY } from '../../../../lib/queries';

export const revalidate = 3600;

export async function generateStaticParams() {
  const data = await fetchFromDato(NEWS_LIST_QUERY);
  return data.allNewsPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }) {
  const data = await fetchFromDato(NEWS_DETAIL_QUERY, { slug: params.slug });
  return { title: `${data.newsPost?.title ?? 'News'} — Fox and Lion` };
}

export default async function NewsDetailPage({ params }) {
  const data = await fetchFromDato(NEWS_DETAIL_QUERY, { slug: params.slug });
  const post = data.newsPost;

  if (!post) {
    return (
      <div className="container" style={{ paddingTop: '2.5rem' }}>
        <h1>Not found</h1>
        <p>This item does not exist or has been unpublished.</p>
      </div>
    );
  }

  const formattedDate = new Date(post.publishedDate).toLocaleDateString(
    'en-GB',
    { day: 'numeric', month: 'long', year: 'numeric' }
  );

  return (
    <article className="container" style={{ paddingTop: '2.5rem' }}>
      <h1>{post.title}</h1>

      <div className="article-meta">
        <div className="article-meta__block">
          <span className="article-meta__label">Date</span>
          <span className="article-meta__value">{formattedDate}</span>
        </div>
        <div className="article-meta__block">
          <span className="article-meta__label">Source</span>
          <span className="article-meta__value">
            <a href={post.sourceUrl} target="_blank" rel="noopener noreferrer">
              {post.sourceUrl}
            </a>
          </span>
        </div>
      </div>

      <div className="article-body">
        <StructuredText data={post.commentary} />
      </div>
    </article>
  );
}
