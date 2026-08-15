import Link from 'next/link';
import { fetchFromDato } from '../../lib/datocms';
import { ANALYSIS_LIST_QUERY, NEWS_LIST_QUERY } from '../../lib/queries';
import { getAllJobs } from '../../lib/ats';
import PostCard from '../../components/PostCard';
import IllustrationPlaceholder from '../../components/IllustrationPlaceholder';
import DefenceNewsList from '../../components/DefenceNewsList';
import JobsList from '../../components/JobsList';
import ExcerptMarkdown from '../../components/ExcerptMarkdown';

export const revalidate = 3600;

export default async function HomePage() {
  const [analysisData, newsData, jobs] = await Promise.all([
    fetchFromDato(ANALYSIS_LIST_QUERY),
    fetchFromDato(NEWS_LIST_QUERY),
    getAllJobs().catch((err) => {
      console.warn('Homepage jobs fetch failed:', err);
      return [];
    }),
  ]);
  const latestJobs = jobs.slice(0, 5);

  const analysisPosts = analysisData.allAnalysisPosts;
  const featured = analysisPosts[0];
  const recentAnalysis = analysisPosts.slice(1, 5);

  const featuredDate = featured?.publishedDate
    ? new Date(featured.publishedDate).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <>
      {featured && (
        <section className="hero">
          <div className="hero__media">
            {featured.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={featured.coverImage.url} alt={featured.coverImage.alt || ''} />
            ) : (
              <IllustrationPlaceholder label="Hero illustration TBD" />
            )}
          </div>
          <div className="hero__copy">
            <p className="hero__label">Analysis</p>
            <h1>{featured.title}</h1>
            <ExcerptMarkdown className="hero__desc">{featured.excerpt}</ExcerptMarkdown>
            <div className="hero__meta">
              {featured.author && <span>{featured.author}</span>}
              {featured.author && featuredDate && <span>&middot;</span>}
              {featuredDate && <span>{featuredDate}</span>}
            </div>
            <div className="hero__cta">
              <Link href={`/analysis/${featured.slug}`} className="eyebrow-link">
                Read the full analysis &rarr;
              </Link>
            </div>
          </div>
        </section>
      )}

      <div className="container">
        <div className="section-header">
          <h2 className="section-label">Recent Analysis</h2>
          <Link href="/analysis" className="section-cta">
            View all analysis &#8599;
          </Link>
        </div>
        <div className="post-grid">
          {recentAnalysis.length === 0 && (
            <p style={{ padding: '1.5rem 0' }}>Nothing published yet.</p>
          )}
          {recentAnalysis.map((post) => (
            <PostCard
              key={post.id}
              href={`/analysis/${post.slug}`}
              date={post.publishedDate}
              title={post.title}
              byline={post.author}
              category={post.category || 'Analysis'}
              coverImageUrl={post.coverImage?.url}
              coverImageAlt={post.coverImage?.alt}
            />
          ))}
        </div>

        <div className="section-header">
          <h2 className="section-label">Defence News</h2>
          <Link href="/news" className="section-cta">
            View all news &#8599;
          </Link>
        </div>
        <DefenceNewsList posts={newsData.allNewsPosts} />

        <JobsList jobs={latestJobs} />
      </div>
    </>
  );
}
