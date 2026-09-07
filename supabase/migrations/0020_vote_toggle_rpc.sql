-- Moves the upvote/downvote *decision* out of the browser and into the
-- database. Run after 0019_batched_thumbnails_rpc.sql, in the Supabase SQL
-- Editor - same as every other file in this folder.
--
-- Why this exists. components/PostEngagement.js used to compute the new
-- vote itself - `nextVote = myVote === direction ? 0 : direction` - and
-- then upsert that value directly into news_post_votes. That only works if
-- the browser actually knows your current vote, and on list pages it
-- didn't: lib/postStats.js reports myVote as 0 for everyone, because
-- looking up the real value server-side needs cookies(), which would force
-- "/", "/news" and "/analysis" out of static/ISR rendering (see the long
-- comment in that file). So on an already-upvoted post the arrow rendered
-- grey, `nextVote` resolved to 1 instead of the toggle-off 0, and the
-- upsert rewrote value=1 over a row that already said value=1 - a
-- successful write that changed nothing, under an optimistic +1 that
-- existed only in React state. That is what showed up as "the arrow turns
-- orange but reverts on refresh" and "the list count is one higher than
-- the detail page".
--
-- The fix is to stop letting the client decide. It now sends only which
-- arrow was pressed; this function reads the caller's existing row, works
-- out insert/flip/delete itself, and hands back the authoritative new
-- score plus the caller's new vote. A wrong client-side myVote can no
-- longer produce a wrong write, because myVote is no longer an input.
--
-- The caller's identity comes from auth.uid() inside the function, never
-- from a parameter - security definer here is only so the post-write
-- recount can see every row (the same reason get_news_post_stats uses it).
-- The RLS policies from 0001_news_post_votes.sql stay in place as a
-- backstop for any direct table access.
--
-- The returned score deliberately mirrors get_news_post_stats' zero-vote
-- seed (`no rows -> 1`, see 0014_seed_new_post_score.sql). If it didn't,
-- the number shown the instant you voted would disagree with the number
-- shown after a refresh - reintroducing the off-by-one this is meant to
-- remove, just on a different code path.

create or replace function toggle_post_vote(ptype text, uid text, direction int)
returns table (score bigint, my_vote smallint)
language plpgsql
security definer
set search_path = public
as $$
declare
  voter uuid := auth.uid();
  existing smallint;
  next_value smallint;
begin
  if voter is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if direction not in (-1, 1) then
    raise exception 'invalid direction: %', direction;
  end if;
  if ptype not in ('news', 'analysis') then
    raise exception 'invalid post_type: %', ptype;
  end if;

  -- Locks the caller's own row for the rest of the transaction so a
  -- double-click can't read the same "before" state twice and race itself.
  -- No row yet is fine (nothing to lock); the unique constraint plus the
  -- ON CONFLICT below covers the insert side of that race.
  select v.value into existing
  from news_post_votes v
  where v.post_type = ptype and v.post_uid = uid and v.user_id = voter
  for update;

  -- Pressing the arrow you already picked clears the vote; anything else
  -- sets it. `is not distinct from` so a missing row (null) compares
  -- correctly rather than yielding null.
  next_value := case
    when existing is not distinct from direction then 0::smallint
    else direction::smallint
  end;

  if next_value = 0 then
    delete from news_post_votes v
    where v.post_type = ptype and v.post_uid = uid and v.user_id = voter;
  else
    insert into news_post_votes (post_type, post_uid, user_id, value)
    values (ptype, uid, voter, next_value)
    on conflict (post_type, post_uid, user_id)
    do update set value = excluded.value, updated_at = now();
  end if;

  return query
  select
    case when count(*) = 0 then 1::bigint else coalesce(sum(v.value), 0)::bigint end,
    next_value
  from news_post_votes v
  where v.post_type = ptype and v.post_uid = uid;
end;
$$;

-- Voting requires a signed-in user, so unlike the read-only stats
-- functions this is not granted to anon.
revoke execute on function toggle_post_vote(text, text, int) from public;
revoke execute on function toggle_post_vote(text, text, int) from anon;
grant execute on function toggle_post_vote(text, text, int) to authenticated;
