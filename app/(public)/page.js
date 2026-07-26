import Link from 'next/link';
import { fetchFromDato } from '../../lib/datocms';
import { ANALYSIS_LIST_QUERY, NEWS_LIST_QUERY } from '../../lib/queries';

export const revalidate = 3600; // re-check DatoCMS once an hour

export default async function HomePage() {
  const [analysisData, newsData] = await Promise.all([
    fetchFromDato(ANALYSIS_LIST_QUERY),
    fetchFromDato(NEWS_LIST_QUERY),
  ]);

  const latestAnalysis = analysisData.allAnalysisPosts.slice(0, 3);
  const latestNews = newsData.allNewsPosts.slice(0, 5);

  return (
    <div className="container">
      <section style={{ margin: '3rem 0' }}>
        <h1>Fox and Lion</h1>
        <p>UK and European defence technology, analysed properly.</p>
      </section>

      <section>
        <h2>Latest Analysis</h2>
        <ul className="post-list">
          {latestAnalysis.map((post) => (
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
        <Link href="/analysis">All Analysis &rarr;</Link>
      </section>

      <section>
        <h2>Latest News</h2>
        <ul className="post-list">
          {latestNews.map((post) => (
            <li key={post.id}>
              <h2>
                <Link href={`/news/${post.slug}`}>{post.title}</Link>
              </h2>
            </li>
          ))}
        </ul>
        <Link href="/news">All News &rarr;</Link>
      </section>
    </div>
  );
}
