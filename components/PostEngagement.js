'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase/client';
import { usePostStats } from './PostStatsProvider';
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

// Vote arrows plus view/comment/share counts for one post. Used unchanged
// on News and Analysis detail pages and on every list surface.
//
// Stats come from a PostStatsProvider above this card when there is one
// (list pages - one batched read for the whole list), and otherwise from
// this component's own fetch (detail pages, where there's a single card and
// a per-instance query is already as cheap as it gets).
//
// `myVote` is three-state on purpose: null means "not resolved yet", 0
// means "resolved, and you haven't voted". Conflating those two is what
// caused list-page votes to appear to work and then revert - see the long
// note in supabase/migrations/0020_vote_toggle_rpc.sql. Nothing in here
// treats null as "not voted": the arrows render inactive, but the write
// path doesn't consult myVote at all, and an unresolved myVote gets
// hydrated below rather than assumed.
export default function PostEngagement({ postUid, postType = 'news', archived = false }) {
  const router = useRouter();
  const { entry, resolvingMyVote, fetchStartedAt } = usePostStats(postUid);

  const [score, setScore] = useState(entry ? entry.score : null);
  const [views, setViews] = useState(entry ? entry.views : null);
  const [comments, setComments] = useState(entry ? entry.comments : null);
  const [shares, setShares] = useState(entry ? entry.shares : null);
  const [myVote, setMyVote] = useState(entry ? entry.myVote : null);
  const [pending, setPending] = useState(false);

  // When this card last successfully wrote a vote. Any snapshot from the
  // provider that was *started* before that write carries pre-vote numbers,
  // so applying it would silently undo the vote on screen.
  //
  // This replaces an earlier `hasVotedRef` flag that, once you voted,
  // ignored every future update from the provider for the rest of the
  // mount. That did stop the stale overwrite, but it also meant a newer,
  // genuinely-correct refresh could never correct the display either - the
  // card stayed frozen on whatever it had optimistically guessed. Comparing
  // timestamps rejects only the snapshots that are actually older, so state
  // still re-converges on the truth afterwards.
  const lastWriteAt = useRef(0);

  // Detail pages: no provider above this card, so fetch its own stats and
  // vote.
  const needsOwnStats = entry === undefined;
  useEffect(() => {
    if (!needsOwnStats) return undefined;

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

      // A signed-out visitor genuinely hasn't voted, so 0 is the real
      // answer here rather than a placeholder.
      if (!session) {
        setMyVote(0);
        return;
      }
      const { data: myRow } = await supabase
        .from('news_post_votes')
        .select('value')
        .eq('post_type', postType)
        .eq('post_uid', postUid)
        .eq('user_id', session.user.id)
        .maybeSingle();
      if (active) setMyVote(myRow?.value ?? 0);
    }

    // Fails soft (stats stay at 0) if the migrations in supabase/migrations
    // haven't been applied yet. myVote is deliberately left null on failure
    // - an unknown vote must not degrade into a confident "you haven't
    // voted", which is the exact bug this component is built around.
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
  }, [needsOwnStats, postUid, postType]);

  // Picks up newer snapshots from the provider. Views/comments/shares are
  // unaffected by voting so they always apply; score/myVote only apply if
  // the snapshot is newer than this card's last write.
  useEffect(() => {
    if (!entry) return;
    setViews(entry.views);
    setComments(entry.comments);
    setShares(entry.shares);
    if (fetchStartedAt > lastWriteAt.current) {
      setScore(entry.score);
      if (entry.myVote !== null) setMyVote(entry.myVote);
    }
  }, [entry, fetchStartedAt]);

  // Fallback vote resolution: this card has stats but its myVote is still
  // unresolved and no batched lookup is going to resolve it - because the
  // provider's refresh failed, or because there is no provider above it.
  // Resolving it costs a single narrow row read, and is what makes "you
  // already voted" render correctly even when the batched path is
  // unavailable. Correctness shouldn't depend on remembering to wire up a
  // provider; that assumption is what left the Analysis list broken.
  const hydratedOwnVote = useRef(false);
  useEffect(() => {
    if (needsOwnStats || myVote !== null || resolvingMyVote || hydratedOwnVote.current) {
      return undefined;
    }
    hydratedOwnVote.current = true;

    let active = true;
    const supabase = createClient();

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (active) setMyVote(0);
        return;
      }
      const { data: myRow, error } = await supabase
        .from('news_post_votes')
        .select('value')
        .eq('post_type', postType)
        .eq('post_uid', postUid)
        .eq('user_id', session.user.id)
        .maybeSingle();
      if (error) throw error;
      if (active) setMyVote(myRow?.value ?? 0);
    })().catch((err) => {
      // Leave myVote null - unresolved, not "unvoted". The write path
      // doesn't depend on it, so voting still works correctly from here.
      console.error('Could not resolve your vote for', postUid, err?.message || err);
    });

    return () => {
      active = false;
    };
  }, [needsOwnStats, myVote, resolvingMyVote, postUid, postType]);

  const handleVote = useCallback(
    async (event, direction) => {
      event.preventDefault();
      event.stopPropagation();
      if (pending || archived) return;

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/sign-in');
        return;
      }

      const prevVote = myVote;
      const prevScore = score;

      setPending(true);

      // Optimistic update only when the current vote is actually known.
      // When it isn't, showing nothing for one round-trip is right;
      // guessing is what produced the phantom +1 that made list counts read
      // one higher than the same post's detail page.
      if (myVote !== null && score !== null) {
        const optimistic = myVote === direction ? 0 : direction;
        setMyVote(optimistic);
        setScore(score - myVote + optimistic);
      }

      // toggle_post_vote resolves insert/flip/delete server-side from the
      // caller's own row and returns the authoritative score and vote - see
      // supabase/migrations/0020_vote_toggle_rpc.sql. The client sends only
      // which arrow was pressed, so a stale or unresolved myVote can't
      // produce a wrong write, and the score is assigned rather than
      // arithmetic applied to a possibly-stale base.
      //
      // Called up to twice: getSession() reads whatever's cached locally
      // without validating it, so a token that expired since the page
      // loaded reads as "signed in" here but gets rejected by the actual
      // write - refreshSession() and retrying once covers that.
      const castVote = () =>
        supabase.rpc('toggle_post_vote', { ptype: postType, uid: postUid, direction });

      try {
        let { data, error } = await castVote();
        if (error) {
          const { data: refreshed } = await supabase.auth.refreshSession();
          if (refreshed?.session) ({ data, error } = await castVote());
        }
        if (error) throw error;

        const row = Array.isArray(data) ? data[0] : data;
        if (!row) throw new Error('toggle_post_vote returned no row');

        lastWriteAt.current = Date.now();
        setScore(row.score);
        setMyVote(row.my_vote);
      } catch (err) {
        // supabase-js resolves rather than throws on a failed write (an
        // expired token, an RLS rejection), so the `error` field above is
        // the only signal that nothing was saved - without checking it the
        // optimistic update stays on screen over an unchanged database.
        console.error('Vote failed to save:', err?.message || err);
        setMyVote(prevVote);
        setScore(prevScore);
      } finally {
        setPending(false);
      }
    },
    [pending, archived, myVote, score, postType, postUid, router]
  );

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
