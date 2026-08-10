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

      <SubmissionPortalForm />
    </div>
  );
}
