-- Adds view tracking for News posts, and replaces
-- get_news_post_vote_totals with a combined stats function (votes + views
-- in one call). Run after 0001_news_post_votes.sql, in the Supabase SQL
-- Editor - same as that file, nothing here is applied automatically.

-- One row per (post_uid, visitor_id) - "visitor_id" is a random id issued
-- client-side via a cookie (see lib/visitorId.js), not tied to a Supabase
-- Auth user, since anonymous readers should count too. The unique
-- constraint means a second view from the same browser is a no-op.
create table if not exists news_post_views (
  id uuid primary key default gen_random_uuid(),
  post_uid text not null,
  visitor_id text not null,
  created_at timestamptz not null default now(),
  unique (post_uid, visitor_id)
);

alter table news_post_views enable row level security;

-- Anyone can record a view, including anonymous requests - there's no
-- server-verified identity here, only a client-set cookie, so this can't
-- be fully abuse-proofed. The unique constraint above only prevents
-- accidental inflation (repeat visits from the same browser), not a
-- deliberate actor minting fresh visitor ids. Accepted tradeoff of
-- sign-in-free view tracking.
create policy "Anyone can record a view"
  on news_post_views for insert
  with check (visitor_id is not null and length(visitor_id) > 0);

-- No select policy - individual rows aren't exposed publicly, only the
-- aggregate via get_news_post_stats below.

drop function if exists get_news_post_vote_totals(text[]);

create or replace function get_news_post_stats(uids text[])
returns table (post_uid text, upvotes bigint, downvotes bigint, score bigint, views bigint)
language sql
security definer
set search_path = public
as $$
  select
    coalesce(v.post_uid, w.post_uid) as post_uid,
    coalesce(v.upvotes, 0) as upvotes,
    coalesce(v.downvotes, 0) as downvotes,
    coalesce(v.score, 0) as score,
    coalesce(w.views, 0) as views
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
  ) w on v.post_uid = w.post_uid;
$$;

grant execute on function get_news_post_stats(text[]) to anon, authenticated;
