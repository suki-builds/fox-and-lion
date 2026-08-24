'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase/client';

// Self-contained: fetches the public score and (if signed in) the
// visitor's own vote itself, on mount. Simple and reusable, at the cost
// of one small query per instance - on a long News list that's a query
// per card rather than one batched call for the whole page. Fine at this
// site's scale; worth revisiting (batch server-side) if the News list
// grows a lot.
export default function VoteButtons({ postUid }) {
  const router = useRouter();
  const [score, setScore] = useState(null);
  const [myVote, setMyVote] = useState(0);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function load() {
      const [{ data: totals }, { data: { session } }] = await Promise.all([
        supabase.rpc('get_news_post_vote_totals', { uids: [postUid] }),
        supabase.auth.getSession(),
      ]);
      if (!active) return;
      setScore(totals?.[0]?.score ?? 0);

      if (session) {
        const { data: myRow } = await supabase
          .from('news_post_votes')
          .select('value')
          .eq('post_uid', postUid)
          .eq('user_id', session.user.id)
          .maybeSingle();
        if (active) setMyVote(myRow?.value ?? 0);
      }
    }

    // Fails soft (score stays at 0) if the migration in
    // supabase/migrations/0001_news_post_votes.sql hasn't been applied yet.
    load().catch(() => {
      if (active) setScore((s) => s ?? 0);
    });

    return () => {
      active = false;
    };
  }, [postUid]);

  async function handleVote(event, direction) {
    event.preventDefault();
    event.stopPropagation();
    if (pending) return;

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
          .eq('post_uid', postUid)
          .eq('user_id', session.user.id);
      } else {
        await supabase
          .from('news_post_votes')
          .upsert(
            { post_uid: postUid, user_id: session.user.id, value: nextVote },
            { onConflict: 'post_uid,user_id' }
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
    <div className="vote-buttons" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        className={`vote-buttons__arrow vote-buttons__arrow--up${myVote === 1 ? ' is-active' : ''}`}
        aria-label="Upvote"
        aria-pressed={myVote === 1}
        disabled={pending}
        onClick={(event) => handleVote(event, 1)}
      >
        &#9650;
      </button>
      <span className="vote-buttons__score">{score === null ? '–' : score}</span>
      <button
        type="button"
        className={`vote-buttons__arrow vote-buttons__arrow--down${myVote === -1 ? ' is-active' : ''}`}
        aria-label="Downvote"
        aria-pressed={myVote === -1}
        disabled={pending}
        onClick={(event) => handleVote(event, -1)}
      >
        &#9660;
      </button>
    </div>
  );
}
