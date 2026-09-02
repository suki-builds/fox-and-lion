import Link from 'next/link';
import { getJobDetail, getCompanyBySlug } from '../../../../../lib/ats';

export async function generateMetadata({ params }) {
  const job = await getJobDetail(params.company, params.id);
  return { title: job ? `${job.title} — ${job.company} — Fox and Lion` : 'Role not found — Fox and Lion' };
}

export default async function JobDetailPage({ params }) {
  const job = await getJobDetail(params.company, params.id);
  // Manually-posted (careers_post) jobs route to our own intake form;
  // ATS-sourced jobs keep applying through their origin platform.
  const isManualJob = !getCompanyBySlug(params.company);

  if (!job) {
    return (
      <div className="container">
        <Link href="/careers" className="job-detail__back">
          &larr; All careers
        </Link>
        <div className="job-detail__not-found">
          <h1>Role not found</h1>
          <p>This listing may have closed or been removed from {params.company}&rsquo;s board.</p>
        </div>
      </div>
    );
  }

  const formattedDate = job.postedAt
    ? new Date(job.postedAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div className="container">
      <Link href="/careers" className="job-detail__back">
        &larr; All careers
      </Link>

      <div className="job-detail__header">
        <p className="job-detail__company">{job.company}</p>
        <h1>{job.title}</h1>
        <div className="job-detail__meta">
          {job.location && <span>{job.location}</span>}
          {job.workplaceType && <span>{job.workplaceType}</span>}
          {job.roleType !== 'Other' && <span>{job.roleType}</span>}
          {job.employmentType && <span>{job.employmentType}</span>}
          {formattedDate && <span>Posted {formattedDate}</span>}
        </div>
        {isManualJob ? (
          <Link href={`/careers/${params.company}/${params.id}/apply`} className="job-detail__apply">
            Apply Now &#8599;
          </Link>
        ) : (
          <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="job-detail__apply">
            Apply Now &#8599;
          </a>
        )}
      </div>

      <div
        className="job-detail__body"
        dangerouslySetInnerHTML={{ __html: job.descriptionHtml }}
      />
    </div>
  );
}
