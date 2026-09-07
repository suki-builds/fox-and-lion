'use client';

import { useEffect, useState } from 'react';
import { getBatchedPostStats } from './postStats';

// Refetches fresh stats (views/comments/shares/score) directly from the
// browser once mounted, overriding whatever was baked into the page at
// last ISR regeneration (up to each page's own `revalidate` window - see
// app/(public)/news/page.js, components/DefenceNewsList.js). One batched
// call for the whole list, not one per card - the same query
// getBatchedPostStats already runs server-side, just triggered from the
// client instead so it isn't limited by page-level caching. Starts from
// `initialStats` (the server-rendered snapshot, so there's no flash of
// empty numbers) and silently keeps that snapshot if the fetch fails.
export function useFreshStats(postType, uids, initialStats) {
  const [stats, setStats] = useState(initialStats);
  const uidsKey = uids.join(',');

  useEffect(() => {
    if (!uidsKey) return undefined;
    let active = true;
    getBatchedPostStats(postType, uidsKey.split(','))
      .then((fresh) => {
        if (active) setStats((prev) => ({ ...prev, ...fresh }));
      })
      .catch(() => {
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
