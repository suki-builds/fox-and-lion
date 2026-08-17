import Link from 'next/link';
import SubmissionPortalForm from '../../../components/SubmissionPortalForm';

export const metadata = {
  title: 'Submission Portal — Fox and Lion',
};

export default function SubmissionPortalPage() {
  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '3rem' }}>
      <h1>Submission Portal</h1>
      <p style={{ color: 'var(--color-text-body)', maxWidth: '680px' }}>
        Before pitching, please read our{' '}
        <Link href="/submission-guidelines" style={{ color: 'var(--color-accent)' }}>
          Contributors&rsquo; Guidelines
        </Link>{' '}
        in full &mdash; it will save contributors and editors alike a great deal of time.
      </p>

      <div className="submission-layout">
        <SubmissionPortalForm />
        <aside className="submission-sidebar">
          <div className="submission-sidebar__box">
            <p>Read the full submission guidelines before you pitch.</p>
            <Link href="/submission-guidelines" className="submission-sidebar__link">
              Submission Guidelines &rarr;
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
