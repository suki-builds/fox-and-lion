'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase/client';
import BarChartIcon from './BarChartIcon';
import CommentIcon from './CommentIcon';
import ShareIcon from './ShareIcon';

// Below 1000, show the exact count - it's short enough to read at a
// glance and precision doesn't hurt. At 1000+, switch to compact notation:
// one decimal place below 10 in the current unit (1k, 3.4k, 9.7k), none
// at 10 or above (11k, 50k) - same rule again once it rolls over into
// millions (1.5m, 9.7m, then 11m, 50m). The screen reader label
// (aria-label, set where this is used) keeps the exact number regardless.
function formatCompactNumber(n) {
  if (n < 1000) return String(n);
  const [divisor, unit] = n < 1_000_000 ? [1_000, 'k'] : [1_000_000, 'm'];
  const value = n / divisor;
  const digits = value < 10 ? 1 : 0;
  return `${value.toFixed(digits).replace(/\.0$/, '')}${unit}`;
}

// `stats`, when provided, is a pre-fetched { score, views, comments,
// shares, myVote } object - see lib/postStats.js's getBatchedPostStats(),
// which every list page now calls once for all its cards. That's what
// keeps this self-contained-fetch fallback below from turning into an N+1
// query pattern on a long list: it only actually runs when a caller hasn't
// already done the batched fetch (currently just the News/Analysis detail
// pages, where there's only ever one instance anyway, so a single query is
// already as cheap as it gets).
export default function PostEngagement({ postUid, postType = 'news', archived = false, stats: providedStats }) {
  const router = useRouter();
  const [score, setScore] = useState(providedStats ? providedStats.score : null);
  const [views, setViews] = useState(providedStats ? providedStats.views : null);
  const [comments, setComments] = useState(providedStats ? providedStats.comments : null);
  const [shares, setShares] = useState(providedStats ? providedStats.shares : null);
  const [myVote, setMyVote] = useState(providedStats ? providedStats.myVote : 0);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (providedStats) return;

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
      setShares(stats?.[0]?.shares ?? 0);

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
        setShares((s) => s ?? 0);
      }
    });

    return () => {
      active = false;
    };
  }, [postUid, postType, providedStats]);

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
      <span className="post-engagement__shares" aria-label={`${shares ?? 0} shares`}>
        <ShareIcon className="post-engagement__shares-icon" />
        {shares === null ? '–' : formatCompactNumber(shares)}
      </span>
    </div>
  );
}
