import { createClient } from './supabase/server';

// Batches get_news_post_stats() and the signed-in visitor's own votes into
// one query each for a whole page's worth of posts, instead of each
// PostEngagement card firing its own pair of queries - see
// components/PostEngagement.js's `stats` prop. On a 20-card list that's the
// difference between ~20 round-trips and 1-2.
//
// Returns a { [postUid]: { score, views, comments, shares, myVote } } map.
// A uid with no votes/views/comments/shares yet still gets an entry (score
// defaults to 1, everything else to 0) so callers don't need their own
// fallback logic - same defaults get_news_post_stats itself uses.
export async function getBatchedPostStats(postType, uids) {
  if (!uids || uids.length === 0) return {};

  const supabase = createClient();
  const [{ data: stats }, { data: { session } }] = await Promise.all([
    supabase.rpc('get_news_post_stats', { ptype: postType, uids }),
    supabase.auth.getSession(),
  ]);

  const result = {};
  for (const uid of uids) {
    result[uid] = { score: 1, views: 0, comments: 0, shares: 0, myVote: 0 };
  }
  (stats || []).forEach((row) => {
    result[row.post_uid] = {
      score: row.score,
      views: row.views,
      comments: row.comments,
      shares: row.shares,
      myVote: 0,
    };
  });

  if (session) {
    const { data: myVotes } = await supabase
      .from('news_post_votes')
      .select('post_uid, value')
      .eq('post_type', postType)
      .eq('user_id', session.user.id)
      .in('post_uid', uids);
    (myVotes || []).forEach((row) => {
      if (result[row.post_uid]) result[row.post_uid].myVote = row.value;
    });
  }

  return result;
}
