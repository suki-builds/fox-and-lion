import GoogleSignInButton from '../../../components/GoogleSignInButton';

export const metadata = {
  title: 'Sign In — Fox and Lion',
};

// Placement/design is provisional - this just gives the OAuth flow
// somewhere to live so it can be wired up and tested end to end.
export default function SignInPage() {
  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '3rem' }}>
      <h1>Sign In</h1>
      <p style={{ color: 'var(--color-text-body)', maxWidth: '680px' }}>
        Sign in with your Google account.
      </p>
      <div style={{ marginTop: '1.5rem' }}>
        <GoogleSignInButton />
      </div>
    </div>
  );
}
