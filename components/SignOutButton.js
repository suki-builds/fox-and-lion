'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase/client';

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  }

  return (
    <button type="button" className="submission-form__submit" onClick={handleSignOut}>
      Sign Out
    </button>
  );
}
