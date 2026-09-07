import { createPublicClient } from './supabase/public';

// Batches get_news_post_stats() into one query for a whole page's worth of
// posts, instead of each PostEngagement card firing its own - see
// components/PostStatsProvider.js, which is what every list surface uses.
// On a 20-card list that's the difference between ~20 round-trips and 1.
//
// Deliberately does NOT also look up the signed-in visitor's own vote on
// each post. That needs cookies() under the hood, and calling cookies()
// anywhere in a Server Component's render path forces the whole page out
// of static/ISR rendering in Next.js - which is exactly what silently
// turned "/", "/news", "/analysis" and "/careers" into fully-dynamic,
// rendered-on-every-request pages, multiplying this function's cost by
// every page view instead of once an hour.
//
// Returns a { [postUid]: { score, views, comments, shares, myVote } } map.
//
// myVote is always **null** here, meaning "not looked up" - not 0, which
// would mean "looked up, and you haven't voted". That distinction is the
// whole point. A previous version reported 0, and PostEngagement had no
// way to tell the two apart: on a post you'd already upvoted the arrow
// rendered grey, and clicking it computed a toggle-*on* instead of a
// toggle-off, writing a no-op upsert underneath an optimistic +1 that only
// ever existed in React state. Reporting null instead means a caller that
// hasn't resolved the real vote is visibly missing it rather than quietly
// asserting a wrong one, and PostEngagement hydrates it client-side (where
// cookies are free) before trusting it.
//
// A uid the RPC returns no row for is simply absent from the map rather
// than being given invented defaults. get_news_post_stats drives off the
// requested uids and returns exactly one row per uid, so in practice that
// only happens when the call itself failed - and a missing entry makes
// PostEngagement fall back to fetching that card's own stats client-side,
// which is correct-but-chattier. Inventing a score here instead is what
// made a failed batch read render as a silent, plausible-looking count
// that disagreed with the same post's detail page by exactly one.
export async function getBatchedPostStats(postType, uids) {
  if (!uids || uids.length === 0) return {};

  const supabase = createPublicClient();
  const { data: stats, error } = await supabase.rpc('get_news_post_stats', {
    ptype: postType,
    uids,
  });

  // supabase-js resolves rather than throws on a failed read, so without
  // this an RLS rejection or a missing/renamed function was indistinguishable
  // from "this page genuinely has no stats yet".
  if (error) {
    console.error(`getBatchedPostStats(${postType}) failed:`, error.message || error);
    return {};
  }

  const result = {};
  (stats || []).forEach((row) => {
    result[row.post_uid] = {
      score: row.score,
      views: row.views,
      comments: row.comments,
      shares: row.shares,
      myVote: null,
    };
  });

  return result;
}
