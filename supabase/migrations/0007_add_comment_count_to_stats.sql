-- Adds a comment count to get_news_post_stats(), for showing a comment
-- count next to the view count on News cards (index page, home page). Only
-- counts non-removed comments, matching what a visitor would actually see
-- if they opened the post. Run after 0006_relax_comment_flood_guard.sql.

drop function if exists get_news_post_stats(text[]);

create or replace function get_news_post_stats(uids text[])
returns table (post_uid text, upvotes bigint, downvotes bigint, score bigint, views bigint, comments bigint)
language sql
security definer
set search_path = public
as $$
  select
    coalesce(v.post_uid, w.post_uid, c.post_uid) as post_uid,
    coalesce(v.upvotes, 0) as upvotes,
    coalesce(v.downvotes, 0) as downvotes,
    coalesce(v.score, 0) as score,
    coalesce(w.views, 0) as views,
    coalesce(c.comments, 0) as comments
  from (
    select
      post_uid,
      count(*) filter (where value = 1) as upvotes,
      count(*) filter (where value = -1) as downvotes,
      coalesce(sum(value), 0) as score
    from news_post_votes
    where post_uid = any(uids)
    group by post_uid
  ) v
  full outer join (
    select post_uid, count(*) as views
    from news_post_views
    where post_uid = any(uids)
    group by post_uid
  ) w on v.post_uid = w.post_uid
  full outer join (
    select post_uid, count(*) as comments
    from news_post_comments
    where post_uid = any(uids) and removed_at is null
    group by post_uid
  ) c on coalesce(v.post_uid, w.post_uid) = c.post_uid;
$$;

grant execute on function get_news_post_stats(text[]) to anon, authenticated;
