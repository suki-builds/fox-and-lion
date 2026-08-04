import { getAllJobs, COMPANIES } from '../../../lib/ats';
import JobsBoard from '../../../components/JobsBoard';

// getAllJobs() is itself cached (see lib/ats.js) — this just needs to
// match that window so the rendered page and the underlying data refresh
// together.
export const revalidate = 3600;

export const metadata = {
  title: 'Careers — Fox and Lion',
};

export default async function JobsPage() {
  const jobs = await getAllJobs();
  const companies = COMPANIES.map(({ name, slug }) => ({ name, slug }));

  return (
    <div className="container" style={{ paddingTop: '2.5rem' }}>
      <div className="jobs-board__header">
        <h1>Defence Tech Careers</h1>
        <p>
          Open roles pulled directly from Anduril, Palantir, and Helsing&rsquo;s public job
          boards &mdash; refreshed hourly.
        </p>
      </div>
      <JobsBoard jobs={jobs} companies={companies} />
    </div>
  );
}
