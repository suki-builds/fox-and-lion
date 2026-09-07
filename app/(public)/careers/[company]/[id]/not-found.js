import Link from 'next/link';

// Keeps the copy the job detail page used to render inline for a missing
// job, but served with a real 404 status instead of a 200 - see the note in
// ./page.js. A not-found.js can't read route params, so this says "the
// company's board" where the old inline version named the company.
export default function JobNotFound() {
  return (
    <div className="container">
      <Link href="/careers" className="job-detail__back">
        &larr; All careers
      </Link>
      <div className="job-detail__not-found">
        <h1>Role not found</h1>
        <p>This listing may have closed or been removed from the company&rsquo;s board.</p>
      </div>
    </div>
  );
}
