import Link from 'next/link';
import { fetchFromDato } from '../../../lib/datocms';
import { ANALYSIS_LIST_QUERY } from '../../../lib/queries';

export const revalidate = 3600;

export const metadata = {
  title: 'Analysis — Fox and Lion',
};

export default async function AnalysisListPage() {
  const data = await fetchFromDato(ANALYSIS_LIST_QUERY);
  const posts = data.allAnalysisPosts;

  return (
    <div className="container">
      <h1>Analysis</h1>
      <ul className="post-list">
        {posts.map((post) => (
          <li key={post.id}>
            <span className="post-meta">
              {new Date(post.publishedDate).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
            <h2>
              <Link href={`/analysis/${post.slug}`}>{post.title}</Link>
            </h2>
            <p>{post.excerpt}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
