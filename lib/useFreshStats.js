'use client';

import { useEffect, useState } from 'react';
import { getBatchedPostStats } from './postStats';
import { createClient } from './supabase/client';

// Refetches fresh stats (views/comments/shares/score) directly from the
// browser once mounted, overriding whatever was baked into the page at
// last ISR regeneration (up to each page's own `revalidate` window - see
// app/(public)/news/page.js, components/DefenceNewsList.js). One batched
// call for the whole list, not one per card - the same query
// getBatchedPostStats already runs server-side, just triggered from the
// client instead so it isn't limited by page-level caching. Starts from
// `initialStats` (the server-rendered snapshot, so there's no flash of
// empty numbers) and silently keeps that snapshot if the fetch fails.
//
// Also looks up the signed-in visitor's own vote on each post, which
// getBatchedPostStats itself deliberately always reports as 0 (see its
// own comment: doing that lookup server-side needs cookies(), which
// forces the whole page out of static/ISR rendering). That constraint
// doesn't apply here - this fetch runs client-side, well after the page
// has already rendered - so there's no reason an already-voted post
// should keep showing its arrow as unvoted every time a list page loads.
// Left unfixed, clicking that wrongly-grey arrow adds an optimistic +1 on
// top of a score that already included the visitor's real vote.
export function useFreshStats(postType, uids, initialStats) {
  const [stats, setStats] = useState(initialStats);
  const uidsKey = uids.join(',');

  useEffect(() => {
    if (!uidsKey) return undefined;
    let active = true;
    const uidList = uidsKey.split(',');

    async function refresh() {
      const supabase = createClient();
      const [fresh, {
        data: { session },
      }] = await Promise.all([getBatchedPostStats(postType, uidList), supabase.auth.getSession()]);

      let myVotes = {};
      if (session) {
        const { data: voteRows } = await supabase
          .from('news_post_votes')
          .select('post_uid, value')
          .eq('post_type', postType)
          .eq('user_id', session.user.id)
          .in('post_uid', uidList);
        (voteRows || []).forEach((row) => {
          myVotes[row.post_uid] = row.value;
        });
      }

      if (!active) return;
      setStats((prev) => {
        const next = { ...prev };
        Object.entries(fresh).forEach(([uid, uidStats]) => {
          next[uid] = { ...uidStats, myVote: myVotes[uid] ?? 0 };
        });
        return next;
      });
    }

    refresh().catch(() => {
      // A refreshed number is a nice-to-have - keep showing the
      // server-rendered snapshot rather than blowing up the page.
    });
    return () => {
      active = false;
    };
    // uidsKey is the flattened, stable form of the uids array - see below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postType, uidsKey]);

  return stats;
}
