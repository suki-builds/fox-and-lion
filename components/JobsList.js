import Link from 'next/link';
import { initials } from './PostCard';

function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// Renders the newest few live roles from lib/ats.js — the full,
// filterable board lives at /jobs.
export default function JobsList({ jobs }) {
  return (
    <div className="jobs-panel">
      <div className="jobs-panel__header">
        <div className="jobs-panel__title">
          <span className="section-label">Defence Tech Careers</span>
          <span className="jobs-panel__chip">Hiring now</span>
        </div>
        <Link href="/jobs" className="jobs-panel__cta">
          View all careers &#8599;
        </Link>
      </div>
      {jobs.length === 0 && <p style={{ padding: '1.5rem 0' }}>No open roles right now.</p>}
      {jobs.map((job) => (
        <Link href={`/jobs/${job.companySlug}/${job.platformId}`} className="job-row" key={job.id}>
          <span className="job-row__avatar">{initials(job.company)}</span>
          <div className="job-row__main">
            <div className="job-row__title-line">
              <span className="job-row__title">{job.title}</span>
              {job.roleType !== 'Other' && <span className="job-row__tag">{job.roleType}</span>}
            </div>
            <div className="job-row__company">
              {job.company} &middot; {job.location || 'Location unspecified'}
            </div>
          </div>
          <div className="job-row__meta">
            {formatDate(job.postedAt) && <span>{formatDate(job.postedAt)}</span>}
            {job.employmentType && <span className="job-row__badge">{job.employmentType}</span>}
          </div>
        </Link>
      ))}
    </div>
  );
}
