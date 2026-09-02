import { getAllJobs } from '../../../lib/ats';
import JobsBoard from '../../../components/JobsBoard';
import FeaturedJobs from '../../../components/FeaturedJobs';

// getAllJobs() is itself cached (see lib/ats.js) — this just needs to
// match that window so the rendered page and the underlying data refresh
// together.
export const revalidate = 3600;

export const metadata = {
  title: 'Careers — Fox and Lion',
};

export default async function JobsPage() {
  const jobs = await getAllJobs();

  // Derived from the jobs themselves (not lib/ats.js's COMPANIES) so a
  // manually-posted job's company shows up as its own Company filter
  // option too, not just the three hardcoded ATS sources.
  const companies = Array.from(
    new Map(jobs.map((job) => [job.companySlug, { name: job.company, slug: job.companySlug }])).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  // Featured jobs also appear in the regular list below (not deduped) —
  // capped at 3, taking the most recently posted if more than 3 are
  // flagged featured in Prismic, since jobs is already sorted newest-first.
  const featuredJobs = jobs.filter((job) => job.featured).slice(0, 3);

  return (
    <div className="container" style={{ paddingTop: '2.5rem' }}>
      <div className="jobs-board__header">
        <h1>Defence Tech Careers</h1>
      </div>
      <FeaturedJobs jobs={featuredJobs} />
      <JobsBoard jobs={jobs} companies={companies} />
    </div>
  );
}
