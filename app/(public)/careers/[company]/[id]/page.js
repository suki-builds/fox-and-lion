import { cache } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllJobs, getJobDetail, getJobMetadataData, getCompanyBySlug } from '../../../../../lib/ats';
import { buildMetadata } from '../../../../../lib/seo';

// Prerendered per job and refreshed hourly, the same as /news/[slug] and
// /analysis/[slug]. Until this was added, this was the one content route in
// the app with no caching at all - it built as `ƒ (Dynamic)` and answered
// every request with `Cache-Control: no-store` and `X-Vercel-Cache: MISS`,
// repeat hits on the same URL included. That's what made it the top Active
// CPU consumer on the project: roughly double any other route's
// invocations, while (going by the Supabase call count over the same
// window) almost none of those requests reached a job that actually exists.
// Matched to the once-a-day sync (vercel.json -> app/api/sync-jobs) that is
// the only thing that changes this data. The hourly window this replaced
// could never surface anything fresher than that sync, but it did set a
// ceiling of 497 regenerations an hour across the prerendered set. I set
// that hourly value when adding ISR here and sized it by habit rather than
// against the data's actual update cadence.
export const revalidate = 86400;

// getJobDetail runs in generateMetadata and again in the page body. For an
// ATS job that was two `select('*')` reads pulling the full row - including
// a description_html that can be ~10KB - to render one page.
const getJob = cache(getJobDetail);

// Jobs re-sync daily (app/api/sync-jobs/route.js) but builds don't, so a
// job added since the last deploy won't be in this list. `dynamicParams`
// stays at its default of true so those still render on demand - and are
// then cached for the revalidate window above rather than re-rendered on
// every request, which is the behaviour that actually mattered here.
export async function generateStaticParams() {
  const jobs = await getAllJobs();
  return jobs.map((job) => ({ company: job.companySlug, id: String(job.platformId) }));
}

export async function generateMetadata({ params }) {
  const job = await getJob(params.company, params.id);
  if (!job) return { title: 'Role not found — Fox and Lion' };

  const data = await getJobMetadataData(params.company, params.id);
  return buildMetadata({
    data,
    fallbackTitle: `${job.title} — ${job.company} — Fox and Lion`,
    fallbackDescription: `${job.roleType !== 'Other' ? `${job.roleType} role` : 'Role'} at ${job.company}${job.location ? ` — ${job.location}` : ''}.`,
  });
}

export default async function JobDetailPage({ params }) {
  const job = await getJob(params.company, params.id);
  // Manually-posted (careers_post) jobs route to our own intake form;
  // ATS-sourced jobs keep applying through their origin platform.
  const isManualJob = !getCompanyBySlug(params.company);

  // notFound() rather than rendering "Role not found" inline, which this
  // used to do - and served with a 200. Any URL under /careers/*/* answered
  // 200, so `/careers/totally-made-up/abc123` was a successful page as far
  // as a crawler was concerned: nothing ever got dropped from an index, and
  // an unbounded set of made-up URLs each cost a full render. A real 404 is
  // cacheable and tells a crawler to stop. See ./not-found.js for the copy.
  if (!job) notFound();

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
