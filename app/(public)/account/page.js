import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import SignOutButton from '../../../components/SignOutButton';

export const metadata = {
  title: 'Account — Fox and Lion',
};

// Deliberately dynamic (uncached, per-request) - unlike the rest of the
// site, which relies on ISR (revalidate = 3600) since it's the same
// content for everyone, this page is inherently per-user.
export default async function AccountPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  const name = user.user_metadata?.full_name || user.user_metadata?.name;
  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '3rem' }}>
      <h1>Account</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '1.5rem' }}>
        {avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            width={64}
            height={64}
            style={{ borderRadius: '50%' }}
          />
        )}
        <div>
          {name && <p style={{ margin: 0, fontWeight: 600 }}>{name}</p>}
          <p style={{ margin: 0, color: 'var(--color-text-body)' }}>{user.email}</p>
        </div>
      </div>
      <div style={{ marginTop: '2rem' }}>
        <SignOutButton />
      </div>
    </div>
  );
}
