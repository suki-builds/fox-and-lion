import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getJobDetail, getCompanyBySlug } from '../../../../../../lib/ats';
import JobApplicationForm from '../../../../../../components/JobApplicationForm';

export async function generateMetadata({ params }) {
  const job = await getJobDetail(params.company, params.id);
  return { title: job ? `Apply — ${job.title} — Fox and Lion` : 'Role not found — Fox and Lion' };
}

export default async function JobApplyPage({ params }) {
  // ATS-sourced roles (Anduril/Palantir/Helsing) apply through their own
  // platform, not this form - it only exists for manually-posted
  // careers_post jobs, which Fox and Lion runs intake for directly. This
  // guards against someone reaching /apply on an ATS job's URL directly.
  if (getCompanyBySlug(params.company)) {
    redirect(`/careers/${params.company}/${params.id}`);
  }

  const job = await getJobDetail(params.company, params.id);

  if (!job) {
    return (
      <div className="container" style={{ paddingTop: '2.5rem' }}>
        <Link href="/careers" className="job-detail__back">
          &larr; All careers
        </Link>
        <div className="job-detail__not-found">
          <h1>Role not found</h1>
          <p>This listing may have closed or been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '3rem' }}>
      <Link href={`/careers/${params.company}/${params.id}`} className="job-detail__back">
        &larr; View full job details
      </Link>

      <div className="job-detail__header">
        <p className="job-detail__company">{job.company}</p>
        <h1>Apply — {job.title}</h1>
        {job.location && (
          <div className="job-detail__meta">
            <span>{job.location}</span>
          </div>
        )}
      </div>

      <JobApplicationForm careersPostUid={params.id} jobTitle={job.title} companyName={job.company} />
    </div>
  );
}
