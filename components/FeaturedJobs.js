import Link from 'next/link';
import CompanyLogo from './CompanyLogo';

function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function FeaturedJobs({ jobs }) {
  if (!jobs.length) return null;

  return (
    <div className="featured-jobs">
      <h2 className="featured-jobs__heading">Featured Jobs</h2>
      <div className="featured-jobs__grid">
        {jobs.map((job) => (
          <Link
            href={`/careers/${job.companySlug}/${job.platformId}`}
            className="featured-jobs__card"
            key={job.id}
          >
            <span className="featured-jobs__badge">Featured</span>
            <div className="featured-jobs__title-line">
              <CompanyLogo name={job.company} domain={job.companyDomain} className="job-row__avatar" />
              <div>
                <div className="featured-jobs__title">{job.title}</div>
                <div className="featured-jobs__company">
                  {job.company} &middot; {job.location || 'Location unspecified'}
                </div>
              </div>
            </div>
            <div className="featured-jobs__meta">
              {formatDate(job.postedAt) && <span>{formatDate(job.postedAt)}</span>}
              {job.workplaceType && <span className="job-row__badge">{job.workplaceType}</span>}
              {job.employmentType && <span className="job-row__badge">{job.employmentType}</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
