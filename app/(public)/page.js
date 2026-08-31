import Link from 'next/link';
import Image from 'next/image';
import { getAnalysisList, getNewsList } from '../../lib/prismic';
import { getAllJobs } from '../../lib/ats';
import PostCard from '../../components/PostCard';
import IllustrationPlaceholder from '../../components/IllustrationPlaceholder';
import DefenceNewsList from '../../components/DefenceNewsList';
import JobsList from '../../components/JobsList';
import { coverImageSrc } from '../../lib/prismicImage';
import { effectivePublishedAt, sortByPublishedAt } from '../../lib/publishedDate';

export const revalidate = 3600;

export default async function HomePage() {
  const [analysisPosts, newsPosts, jobs] = await Promise.all([
    getAnalysisList(),
    getNewsList(),
    getAllJobs().catch((err) => {
      console.warn('Homepage jobs fetch failed:', err);
      return [];
    }),
  ]);
  const latestJobs = jobs.slice(0, 5);

  const sortedAnalysis = sortByPublishedAt(analysisPosts);
  const featured = sortedAnalysis[0];
  const recentAnalysis = sortedAnalysis.slice(1, 5);

  const featuredDate = featured
    ? new Date(effectivePublishedAt(featured)).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <>
      {featured && (
        <section className="hero">
          <Link href={`/analysis/${featured.uid}`} className="hero__media">
            {featured.data.cover_image?.url ? (
              <Image
                src={coverImageSrc(featured.data.cover_image.url)}
                alt={featured.data.cover_image.alt || ''}
                fill
                sizes="(max-width: 900px) 100vw, 1200px"
                priority
              />
            ) : (
              <IllustrationPlaceholder label="Hero illustration TBD" />
            )}
          </Link>
          <div className="hero__copy">
            <p className="hero__label">Analysis</p>
            <Link href={`/analysis/${featured.uid}`} className="hero__title-link">
              <h1>{featured.data.title}</h1>
            </Link>
            <div className="hero__meta">
              {featured.data.author && <span>{featured.data.author}</span>}
              {featured.data.author && featuredDate && <span>&middot;</span>}
              {featuredDate && <span>{featuredDate}</span>}
            </div>
            <div className="hero__cta">
              <Link href={`/analysis/${featured.uid}`} className="eyebrow-link">
                Read the full analysis &rarr;
              </Link>
            </div>
          </div>
        </section>
      )}

      <div className="container">
        <div className="section-header">
          <h2 className="section-label">Latest News</h2>
          <Link href="/news" className="section-cta">
            View all news &#8599;
          </Link>
        </div>
        <DefenceNewsList posts={newsPosts} />

        <div className="section-header">
          <h2 className="section-label">Recent Analysis</h2>
          <Link href="/analysis" className="section-cta">
            View all analysis &#8599;
          </Link>
        </div>
        <div className="recent-analysis-grid">
          {recentAnalysis.length === 0 && (
            <p style={{ padding: '1.5rem 0' }}>Nothing published yet.</p>
          )}
          {recentAnalysis.map((post) => (
            <PostCard
              key={post.id}
              href={`/analysis/${post.uid}`}
              date={effectivePublishedAt(post)}
              title={post.data.title}
              byline={post.data.author}
              category={post.data.category || 'Analysis'}
              coverImageUrl={coverImageSrc(post.data.cover_image?.url)}
              coverImageAlt={post.data.cover_image?.alt}
              coverRatio
            />
          ))}
        </div>

        <JobsList jobs={latestJobs} />
      </div>
    </>
  );
}
