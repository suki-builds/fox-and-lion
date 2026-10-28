import Link from 'next/link';
import Image from 'next/image';
import { getAnalysisList, getNewsList } from '../../lib/prismic';
import { getAllJobs } from '../../lib/ats';
import IllustrationPlaceholder from '../../components/IllustrationPlaceholder';
import DefenceNewsList from '../../components/DefenceNewsList';
import AnalysisGrid from '../../components/AnalysisGrid';
import MostPopular from '../../components/MostPopular';
import JobsList from '../../components/JobsList';
import NewsletterSignup from '../../components/NewsletterSignup';
import { coverImageSrc, imageAspectRatio } from '../../lib/prismicImage';
import { effectivePublishedAt, sortByPublishedAt } from '../../lib/publishedDate';

export const revalidate = 3600;

export default async function HomePage() {
  const [analysisPosts, newsPosts, jobs] = await Promise.all([
    getAnalysisList(),
    getNewsList(),
    // No catch: a failed jobs read used to become an empty list, cached
    // with the homepage for up to an hour. getAllJobs now throws at
    // runtime so the last good homepage keeps being served, and degrades
    // on its own during a build - see lib/ats.js.
    getAllJobs(),
  ]);
  // Featured jobs (capped at 3, same as /careers) always claim a slot in
  // the homepage teaser rather than only appearing if they happen to be
  // among the newest overall — backfilled with the next-newest jobs up to
  // 5 total.
  const featuredJobs = jobs.filter((job) => job.featured).slice(0, 3);
  const featuredIds = new Set(featuredJobs.map((job) => job.id));
  const otherJobs = jobs.filter((job) => !featuredIds.has(job.id));
  const latestJobs = [...featuredJobs, ...otherJobs].slice(0, 5);

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
  const featuredCategory = featured ? featured.data.category || 'Analysis' : null;

  return (
    <>
      {featured && (
        <section className="hero">
          <Link
            href={`/analysis/${featured.uid}`}
            className="hero__media"
            style={{ aspectRatio: imageAspectRatio(featured.data.cover_image) }}
          >
            {featured.data.cover_image?.url ? (
              <Image
                src={coverImageSrc(featured.data.cover_image.url)}
                alt={featured.data.cover_image.alt || ''}
                fill
                sizes="(max-width: 900px) 100vw, 1200px"
                quality={90}
                priority
              />
            ) : (
              <IllustrationPlaceholder label="Hero illustration TBD" />
            )}
          </Link>
          <div className="hero__copy">
            <p className="hero__label">{featuredCategory}</p>
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
                Read the full {featuredCategory.toLowerCase()} &rarr;
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

        <NewsletterSignup />

        <div className="section-header">
          <h2 className="section-label">Recent Analysis</h2>
          <Link href="/analysis" className="section-cta">
            View all analysis &#8599;
          </Link>
        </div>
        <AnalysisGrid posts={recentAnalysis} />

        <MostPopular posts={analysisPosts} />

        <JobsList jobs={latestJobs} />
      </div>
    </>
  );
}
