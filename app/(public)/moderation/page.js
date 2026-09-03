import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import ModerationQueue from '../../../components/ModerationQueue';

export const metadata = {
  title: 'Moderation — Fox and Lion',
  robots: { index: false, follow: false },
};

// Not linked from any nav - moderators just know the URL, same as /account
// isn't in the nav either. Gated server-side via is_moderator() (defined in
// supabase/migrations/0005_comment_reports_and_moderation.sql), checked
// under the requester's own session/RLS - there's no separate admin auth
// system, just the moderators table.
export default async function ModerationPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  const { data: isMod } = await supabase.rpc('is_moderator');
  if (!isMod) {
    redirect('/');
  }

  const { data: reports } = await supabase
    .from('news_comment_reports')
    .select('*, news_post_comments(id, post_uid, post_type, body, user_id, removed_at)')
    .eq('status', 'open')
    .order('created_at', { ascending: true });

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '3rem' }}>
      <h1>Moderation Queue</h1>
      <ModerationQueue initialReports={reports || []} />
    </div>
  );
}
