'use client';

import { useEffect } from 'react';
import { createClient } from '../lib/supabase/client';
import { getOrCreateVisitorId } from '../lib/visitorId';

// Renders nothing - fire-and-forget records a view for this post the first
// time this browser loads it. Goes through the record_view() RPC rather
// than a direct table upsert - see 0011_record_view_rpc.sql for why (a
// PostgREST issue meant anon's direct table grant on news_post_views
// wasn't actually being honoured). The RPC itself does the equivalent
// ON CONFLICT DO NOTHING, so repeat visits are still a silent no-op.
export default function ViewTracker({ postUid }) {
  useEffect(() => {
    const supabase = createClient();
    supabase.rpc('record_view', { uid: postUid, visitor: getOrCreateVisitorId() }).then(() => {});
  }, [postUid]);

  return null;
}
