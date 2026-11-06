import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import ModerationQueue from '../../../components/ModerationQueue';
import HeldComments from '../../../components/HeldComments';

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
    .select('*, news_post_comments(id, post_uid, post_type, body, user_id, guest_name, removed_at)')
    .eq('status', 'open')
    .order('created_at', { ascending: true });

  // Guest comments the filters held back - see app/api/guest-comment/route.js.
  const { data: held } = await supabase
    .from('news_post_comments')
    .select('id, post_uid, post_type, body, guest_name, created_at, news_comment_guest_meta(flag_reasons)')
    .eq('removed_reason', 'held for review')
    .order('created_at', { ascending: true });

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '3rem' }}>
      <h1>Moderation Queue</h1>
      <h2 className="moderation-section__heading">Held for review</h2>
      <HeldComments initialComments={held || []} />
      <h2 className="moderation-section__heading">Reports</h2>
      <ModerationQueue initialReports={reports || []} />
    </div>
  );
}
