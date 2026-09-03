'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase/client';
import BarChartIcon from './BarChartIcon';
import CommentIcon from './CommentIcon';

// Below 1000, show the exact count - it's short enough to read at a
// glance and precision doesn't hurt. At 1000+, switch to compact notation
// (1k, 1.5k, 15k) since View counts can run into the tens of thousands
// and exact digits stop being meaningful past that point. The screen
// reader label (aria-label, set where this is used) keeps the exact
// number regardless.
function formatCompactNumber(n) {
  if (n < 1000) return String(n);
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })
    .format(n)
    .toLowerCase();
}

// Self-contained: fetches this post's public stats (score + views) and, if
// signed in, the visitor's own vote, on mount. Simple and reusable, at the
// cost of one small query per instance - on a long News list that's a
// query per card rather than one batched call for the whole page. Fine at
// this site's scale; worth revisiting (batch server-side) if the News list
// grows a lot.
export default function PostEngagement({ postUid, postType = 'news', archived = false }) {
  const router = useRouter();
  const [score, setScore] = useState(null);
  const [views, setViews] = useState(null);
  const [comments, setComments] = useState(null);
  const [myVote, setMyVote] = useState(0);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function load() {
      const [{ data: stats }, { data: { session } }] = await Promise.all([
        supabase.rpc('get_news_post_stats', { ptype: postType, uids: [postUid] }),
        supabase.auth.getSession(),
      ]);
      if (!active) return;
      setScore(stats?.[0]?.score ?? 0);
      setViews(stats?.[0]?.views ?? 0);
      setComments(stats?.[0]?.comments ?? 0);

      if (session) {
        const { data: myRow } = await supabase
          .from('news_post_votes')
          .select('value')
          .eq('post_type', postType)
          .eq('post_uid', postUid)
          .eq('user_id', session.user.id)
          .maybeSingle();
        if (active) setMyVote(myRow?.value ?? 0);
      }
    }

    // Fails soft (stats stay at 0) if the migrations in supabase/migrations
    // haven't been applied yet.
    load().catch(() => {
      if (active) {
        setScore((s) => s ?? 0);
        setViews((v) => v ?? 0);
        setComments((c) => c ?? 0);
      }
    });

    return () => {
      active = false;
    };
  }, [postUid, postType]);

  async function handleVote(event, direction) {
    event.preventDefault();
    event.stopPropagation();
    if (pending || archived) return;

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push('/sign-in');
      return;
    }

    const prevVote = myVote;
    const prevScore = score ?? 0;
    const nextVote = myVote === direction ? 0 : direction;

    setPending(true);
    setMyVote(nextVote);
    setScore(prevScore - prevVote + nextVote);

    try {
      if (nextVote === 0) {
        await supabase
          .from('news_post_votes')
          .delete()
          .eq('post_type', postType)
          .eq('post_uid', postUid)
          .eq('user_id', session.user.id);
      } else {
        await supabase
          .from('news_post_votes')
          .upsert(
            { post_type: postType, post_uid: postUid, user_id: session.user.id, value: nextVote },
            { onConflict: 'post_type,post_uid,user_id' }
          );
      }
    } catch {
      setMyVote(prevVote);
      setScore(prevScore);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="post-engagement" onClick={(event) => event.stopPropagation()}>
      <div className="post-engagement__votes">
        <button
          type="button"
          className={`post-engagement__arrow post-engagement__arrow--up${myVote === 1 ? ' is-active' : ''}${archived ? ' is-archived' : ''}`}
          aria-label={archived ? 'Upvoting is closed for this archived post' : 'Upvote'}
          aria-pressed={myVote === 1}
          disabled={pending || archived}
          onClick={(event) => handleVote(event, 1)}
        >
          {archived ? '△' : '▲'}
        </button>
        <span className="post-engagement__score">{score === null ? '–' : score}</span>
        <button
          type="button"
          className={`post-engagement__arrow post-engagement__arrow--down${myVote === -1 ? ' is-active' : ''}${archived ? ' is-archived' : ''}`}
          aria-label={archived ? 'Downvoting is closed for this archived post' : 'Downvote'}
          aria-pressed={myVote === -1}
          disabled={pending || archived}
          onClick={(event) => handleVote(event, -1)}
        >
          {archived ? '▽' : '▼'}
        </button>
      </div>
      <span className="post-engagement__views" aria-label={`${views ?? 0} views`}>
        <BarChartIcon className="post-engagement__views-icon" />
        {views === null ? '–' : formatCompactNumber(views)}
      </span>
      <span className="post-engagement__comments" aria-label={`${comments ?? 0} comments`}>
        <CommentIcon className="post-engagement__comments-icon" />
        {comments === null ? '–' : comments}
      </span>
    </div>
  );
}
