import { getAllJobs, COMPANIES } from '../../../lib/ats';
import JobsBoard from '../../../components/JobsBoard';

// No caching yet — each request re-fetches all four ATS APIs live. Fine
// for now since the fetch-and-refresh scheduling is a deliberately
// separate piece of work; revisit once that's built.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Jobs — Fox and Lion',
};

export default async function JobsPage() {
  const jobs = await getAllJobs();
  const companies = COMPANIES.map(({ name, slug }) => ({ name, slug }));

  return (
    <div className="container" style={{ paddingTop: '2.5rem' }}>
      <div className="jobs-board__header">
        <h1>Defence Tech Jobs</h1>
        <p>
          Open roles pulled directly from Anduril, Palantir, Shield AI, and Helsing&rsquo;s public
          job boards &mdash; refreshed hourly.
        </p>
      </div>
      <JobsBoard jobs={jobs} companies={companies} />
    </div>
  );
}
