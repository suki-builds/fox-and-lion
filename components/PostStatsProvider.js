'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getBatchedPostStats } from '../lib/postStats';
import { createClient } from '../lib/supabase/client';

// Supplies a whole list of PostEngagement cards with their stats, in one
// batched read, and - critically - with the signed-in visitor's own vote
// resolved.
//
// This replaces lib/useFreshStats.js, which did the same refresh but had to
// be remembered at each call site. It was wired into the News list and the
// homepage's News section and not into the Analysis list or the homepage's
// Analysis grid, so those two kept rendering every arrow as unvoted
// forever. Correctness that depends on remembering to call a hook is
// correctness that eventually gets forgotten; a card that isn't inside a
// provider now falls back to resolving its own vote (see
// PostEngagement.js) rather than silently assuming you haven't voted.
//
// Two jobs, both of which have to happen in the browser:
//
//  1. Refresh score/views/comments/shares. The server-rendered numbers were
//     baked in at the last ISR regeneration and can be up to an hour stale
//     (each list page sets `revalidate = 3600`). Same query the server
//     already ran, just not subject to page-level caching.
//
//  2. Look up myVote, which lib/postStats.js deliberately reports as null.
//     Doing that server-side needs cookies(), which would drop these pages
//     out of static/ISR rendering entirely. Client-side it costs nothing.
//
// `fetchStartedAt` is stamped on every snapshot so a card that has just
// voted can tell whether an incoming refresh is older or newer than its own
// write - see PostEngagement.js. Without it, a refresh already in flight
// when you voted would land afterwards carrying pre-vote numbers and quietly
// undo the vote on screen.

const PostStatsContext = createContext(null);

// Returns { entry, resolvingMyVote, fetchStartedAt } for one post. `entry`
// is undefined when there's no provider above this card, or when the
// provider has nothing for this uid - both of which mean "fetch it
// yourself". resolvingMyVote is true while a batched vote lookup is still
// in flight, so a card knows to wait rather than firing its own duplicate.
export function usePostStats(postUid) {
  const ctx = useContext(PostStatsContext);
  if (!ctx) return { entry: undefined, resolvingMyVote: false, fetchStartedAt: 0 };
  return {
    entry: ctx.stats[postUid],
    resolvingMyVote: ctx.resolvingMyVote,
    fetchStartedAt: ctx.fetchStartedAt,
  };
}

export default function PostStatsProvider({ postType, uids, initialStats, children }) {
  const [stats, setStats] = useState(initialStats || {});
  const [fetchStartedAt, setFetchStartedAt] = useState(0);
  // Starts true so cards don't race ahead and fetch their own vote before
  // this batched lookup has had a chance to run.
  const [resolvingMyVote, setResolvingMyVote] = useState(true);

  // The flattened, stable form of `uids` - callers build that array inline,
  // so it's a new reference every render and can't be a dependency itself.
  const uidsKey = (uids || []).join(',');

  useEffect(() => {
    if (!uidsKey) {
      setResolvingMyVote(false);
      return undefined;
    }

    let active = true;
    const uidList = uidsKey.split(',');
    const startedAt = Date.now();

    async function refresh() {
      const supabase = createClient();
      const [fresh, { data: { session } }] = await Promise.all([
        getBatchedPostStats(postType, uidList),
        supabase.auth.getSession(),
      ]);

      const myVotes = {};
      if (session) {
        const { data: voteRows, error } = await supabase
          .from('news_post_votes')
          .select('post_uid, value')
          .eq('post_type', postType)
          .eq('user_id', session.user.id)
          .in('post_uid', uidList);
        if (error) throw error;
        (voteRows || []).forEach((row) => {
          myVotes[row.post_uid] = row.value;
        });
      }

      if (!active) return;
      setStats((prev) => {
        const next = { ...prev };
        Object.entries(fresh).forEach(([uid, uidStats]) => {
          // A signed-out visitor has genuinely not voted, so 0 is the real
          // answer here, not a placeholder.
          next[uid] = { ...uidStats, myVote: myVotes[uid] ?? 0 };
        });
        return next;
      });
      setFetchStartedAt(startedAt);
    }

    refresh()
      .catch((err) => {
        // A refreshed number is a nice-to-have - keep showing the
        // server-rendered snapshot rather than blowing up the page. Cards
        // whose myVote is still unresolved will fall back to fetching it
        // themselves once resolvingMyVote flips false below.
        console.error('PostStatsProvider refresh failed:', err?.message || err);
      })
      .finally(() => {
        if (active) setResolvingMyVote(false);
      });

    return () => {
      active = false;
    };
  }, [postType, uidsKey]);

  const value = useMemo(
    () => ({ stats, resolvingMyVote, fetchStartedAt }),
    [stats, resolvingMyVote, fetchStartedAt]
  );

  return <PostStatsContext.Provider value={value}>{children}</PostStatsContext.Provider>;
}
