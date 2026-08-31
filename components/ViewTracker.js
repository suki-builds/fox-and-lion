'use client';

import { useEffect } from 'react';
import { createClient } from '../lib/supabase/client';
import { getOrCreateVisitorId } from '../lib/visitorId';

// Renders nothing - fire-and-forget records a view every time this
// component mounts, i.e. every time a reader loads this post (including
// navigating away and back). Goes through the record_view() RPC rather than
// a direct table insert - see 0011_record_view_rpc.sql for why (a
// PostgREST issue meant anon's direct table grant on news_post_views wasn't
// actually being honoured). As of 0013_count_every_view.sql this is a raw
// page-view counter, not a unique-visitor counter - there's no dedup.
export default function ViewTracker({ postUid }) {
  useEffect(() => {
    const supabase = createClient();
    supabase.rpc('record_view', { uid: postUid, visitor: getOrCreateVisitorId() }).then(() => {});
  }, [postUid]);

  return null;
}
