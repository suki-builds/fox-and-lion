-- Ranks posts by views within a recent window, for the homepage's "Most
-- Popular" box (components/MostPopular.js), which shows the most-read
-- analysis articles of the last 30 days.
--
-- get_news_post_stats only returns all-time totals, and news_post_views has
-- no public select policy (individual view rows aren't exposed), so this is
-- a security definer function returning aggregates only, like that one.
--
-- It returns raw post_uids. A uid can belong to a post that has since been
-- unpublished, so the caller asks for more rows than it shows and keeps only
-- uids it can match to a live Prismic document.

create or replace function get_top_viewed_posts(ptype text, since timestamptz, max_results int)
returns table (post_uid text, views bigint)
language sql
stable
security definer
set search_path = public
as $$
  select post_uid, count(*) as views
  from news_post_views
  where post_type = ptype and created_at >= since
  group by post_uid
  order by views desc
  limit max_results;
$$;

grant execute on function get_top_viewed_posts(text, timestamptz, int) to anon, authenticated;

-- Keeps the window scan cheap as the views table grows.
create index if not exists news_post_views_type_created_idx
  on news_post_views (post_type, created_at);
