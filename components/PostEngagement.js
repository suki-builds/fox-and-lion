'use client';

import { useEffect, useRef, useState } from 'react';
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

  // pendingRef mirrors `pending` without being a dependency below - see
  // why in the comment on that effect.
  const pendingRef = useRef(pending);
  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  // Picks up a later, fresher `stats` object from the caller (see
  // lib/useFreshStats.js) - the useState calls above only apply on first
  // render, so without this a client-side stats refresh handed down as a
  // new `stats` prop would never actually reach the screen. Deliberately
  // keyed only on `providedStats`, not `pending`: a vote's own handleVote
  // flips `pending` true then false again, and if `pending` were a
  // dependency here that false-again transition re-ran this effect with
  // whatever (now stale) `providedStats` the caller last passed down,
  // stomping the vote that had just been optimistically applied and
  // actually saved a moment earlier - the vote would flash active and
  // immediately revert. Reading pendingRef.current instead still skips
  // syncing while a vote is genuinely in flight, without that unwanted
  // re-run once it finishes.
  useEffect(() => {
    if (!providedStats || pendingRef.current) return;
    setViews(providedStats.views);
    setComments(providedStats.comments);
    setShares(providedStats.shares);
    setScore(providedStats.score);
    setMyVote(providedStats.myVote);
  }, [providedStats]);

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

    // Supabase-js doesn't throw on a failed write (an expired access token,
    // an RLS rejection) - it resolves normally with an `error` field, so a
    // bare try/catch around these calls never sees it and the optimistic
    // update above was staying on screen even when nothing was actually
    // saved. writeVote() below is called up to twice: getSession() reads
    // whatever's cached locally without validating it, so a token that
    // expired since the page loaded reads as "signed in" here but gets
    // rejected by the actual write - refreshSession() and retrying once
    // covers that case instead of just failing more visibly.
    async function writeVote(userId) {
      if (nextVote === 0) {
        return supabase
          .from('news_post_votes')
          .delete()
          .eq('post_type', postType)
          .eq('post_uid', postUid)
          .eq('user_id', userId);
      }
      return supabase
        .from('news_post_votes')
        .upsert(
          { post_type: postType, post_uid: postUid, user_id: userId, value: nextVote },
          { onConflict: 'post_type,post_uid,user_id' }
        );
    }

    try {
      let { error } = await writeVote(session.user.id);
      if (error) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        if (refreshed?.session) {
          ({ error } = await writeVote(refreshed.session.user.id));
        }
      }
      if (error) throw error;
    } catch (err) {
      console.error('Vote failed to save:', err.message || err);
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
