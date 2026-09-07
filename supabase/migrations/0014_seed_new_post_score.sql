-- Posts with no votes at all now show a score of 1 instead of 0, so a
-- brand-new post doesn't launch looking unliked. This applies
-- automatically to every post going forward (nothing "runs on post
-- creation" - posts live in Prismic, not this database, so there's no
-- creation hook to seed a row from) and retroactively backfills every
-- existing post that currently sits at 0, since the seed is computed at
-- read time rather than stored. Run after 0013_count_every_view.sql, in
-- the Supabase SQL Editor - same as every other file in this folder.
--
-- Once a post has even one real vote, that real total always wins - even
-- a genuine net-zero (e.g. one upvote and one downvote) is left alone.
-- Only the total absence of any vote row triggers the +1 baseline.
--
-- Also switches from the old chain of full outer joins - which only
-- returned a row for a post_uid that had SOME activity (votes, views, or
-- comments) - to driving the query off the requested uids directly, so
-- every request gets exactly one row back, including a post with zero
-- activity of every kind. Without this, the seeded score would never
-- reach the client for a genuinely brand-new, unviewed post.

drop function if exists get_news_post_stats(text[]);

create or replace function get_news_post_stats(uids text[])
returns table (post_uid text, upvotes bigint, downvotes bigint, score bigint, views bigint, comments bigint)
language sql
security definer
set search_path = public
as $$
  select
    u.post_uid,
    coalesce(v.upvotes, 0) as upvotes,
    coalesce(v.downvotes, 0) as downvotes,
    case when v.post_uid is null then 1 else v.score end as score,
    coalesce(w.views, 0) as views,
    coalesce(c.comments, 0) as comments
  from unnest(uids) as u(post_uid)
  left join (
    select
      post_uid,
      count(*) filter (where value = 1) as upvotes,
      count(*) filter (where value = -1) as downvotes,
      coalesce(sum(value), 0) as score
    from news_post_votes
    where post_uid = any(uids)
    group by post_uid
  ) v on v.post_uid = u.post_uid
  left join (
    select post_uid, count(*) as views
    from news_post_views
    where post_uid = any(uids)
    group by post_uid
  ) w on w.post_uid = u.post_uid
  left join (
    select post_uid, count(*) as comments
    from news_post_comments
    where post_uid = any(uids) and removed_at is null
    group by post_uid
  ) c on c.post_uid = u.post_uid;
$$;

grant execute on function get_news_post_stats(text[]) to anon, authenticated;
