import { fetchFromDato } from '../../../../lib/datocms';
import {
  CAREERS_LIST_QUERY,
  CAREERS_DETAIL_QUERY,
} from '../../../../lib/queries';

export const revalidate = 3600;

export async function generateStaticParams() {
  const data = await fetchFromDato(CAREERS_LIST_QUERY);
  return data.allCareersPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }) {
  const data = await fetchFromDato(CAREERS_DETAIL_QUERY, {
    slug: params.slug,
  });
  return { title: `${data.careersPost?.title ?? 'Careers'} — Fox and Lion` };
}

export default async function CareersDetailPage({ params }) {
  const data = await fetchFromDato(CAREERS_DETAIL_QUERY, {
    slug: params.slug,
  });
  const post = data.careersPost;

  if (!post) {
    return (
      <div className="container" style={{ paddingTop: '2.5rem' }}>
        <h1>Not found</h1>
        <p>This listing does not exist or has been unpublished.</p>
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
          <span className="article-meta__label">Posted</span>
          <span className="article-meta__value">{formattedDate}</span>
        </div>
      </div>

      <div className="article-body">
        <p>{post.description}</p>
        <p>
          <a
            href={post.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="eyebrow-link"
          >
            Apply here &rarr;
          </a>
        </p>
      </div>
    </article>
  );
}
