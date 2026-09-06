import { createPublicClient } from './supabase/public';

// Batches get_news_post_stats() into one query for a whole page's worth of
// posts, instead of each PostEngagement card firing its own - see
// components/PostEngagement.js's `stats` prop. On a 20-card list that's the
// difference between ~20 round-trips and 1.
//
// Deliberately does NOT also look up the signed-in visitor's own vote on
// each post (a prior version did, via supabase.auth.getSession()). That
// needs cookies() under the hood, and calling cookies() anywhere in a
// Server Component's render path forces the whole page out of static/ISR
// rendering in Next.js - which is exactly what silently turned "/",
// "/news", "/analysis" and "/careers" into fully-dynamic,
// rendered-on-every-request pages, multiplying this function's cost by
// every page view instead of once an hour. Trade-off: list-view vote
// arrows no longer pre-highlight a post you'd previously voted on - they
// still work correctly the moment you interact with them (PostEngagement's
// own client-side vote handling is unaffected), this just drops the
// pre-fill. Detail pages don't use this batching at all (one card, so a
// per-instance fetch was never the N+1 problem this exists to solve) and
// keep showing your prior vote correctly, cookies and all.
//
// Returns a { [postUid]: { score, views, comments, shares, myVote } } map.
// A uid with no votes/views/comments/shares yet still gets an entry (score
// defaults to 1, everything else to 0) so callers don't need their own
// fallback logic - same defaults get_news_post_stats itself uses. myVote
// is always 0 here, kept in the shape so PostEngagement's prop contract
// doesn't need to change based on which caller supplied it.
export async function getBatchedPostStats(postType, uids) {
  if (!uids || uids.length === 0) return {};

  const supabase = createPublicClient();
  const { data: stats } = await supabase.rpc('get_news_post_stats', { ptype: postType, uids });

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

  return result;
}
