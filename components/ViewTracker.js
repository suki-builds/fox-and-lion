'use client';

import { useEffect } from 'react';
import { createClient } from '../lib/supabase/client';
import { getOrCreateVisitorId } from '../lib/visitorId';

// Renders nothing - fire-and-forget records a view for this post the first
// time this browser loads it. ignoreDuplicates means repeat visits are a
// silent no-op (ON CONFLICT DO NOTHING) rather than an error.
export default function ViewTracker({ postUid }) {
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('news_post_views')
      .upsert(
        { post_uid: postUid, visitor_id: getOrCreateVisitorId() },
        { onConflict: 'post_uid,visitor_id', ignoreDuplicates: true }
      )
      .then(() => {});
  }, [postUid]);

  return null;
}
