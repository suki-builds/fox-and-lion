-- Adds share tracking for News/Analysis posts, mirroring news_post_views
-- (0002_news_post_views_and_stats.sql, 0013_count_every_view.sql) and the
-- post_type split from 0015_analysis_post_engagement.sql. One row per share
-- action that actually completed - the native share sheet resolved, or the
-- clipboard-copy fallback succeeded - not per click, since a dismissed
-- share sheet isn't a share. See lib/share.js.
--
-- Run after 0015_analysis_post_engagement.sql, in the Supabase SQL Editor -
-- same as every other file in this folder.

create table if not exists news_post_shares (
  id uuid primary key default gen_random_uuid(),
  post_type text not null default 'news' check (post_type in ('news', 'analysis')),
  post_uid text not null,
  visitor_id text not null,
  created_at timestamptz not null default now()
);

alter table news_post_shares enable row level security;

-- Anyone can record a share, including anonymous requests - same
-- anon-insert-only model as news_post_views, and for the same reason
-- (sign-in-free tracking, not fully abuse-proofed). No select policy -
-- individual rows aren't exposed publicly, only the aggregate via
-- get_news_post_stats below.
create policy "Anyone can record a share"
  on news_post_shares for insert
  with check (visitor_id is not null and length(visitor_id) > 0);

-- Adds a shares count alongside the existing votes/views/comments -
-- signature is unchanged (ptype text, uids text[]) but the returned row
-- shape gains a column, which create or replace can't do on its own for a
-- `returns table` function, hence the drop first.
drop function if exists get_news_post_stats(text, text[]);

create or replace function get_news_post_stats(ptype text, uids text[])
returns table (post_uid text, upvotes bigint, downvotes bigint, score bigint, views bigint, comments bigint, shares bigint)
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
    coalesce(c.comments, 0) as comments,
    coalesce(s.shares, 0) as shares
  from unnest(uids) as u(post_uid)
  left join (
    select
      post_uid,
      count(*) filter (where value = 1) as upvotes,
      count(*) filter (where value = -1) as downvotes,
      coalesce(sum(value), 0) as score
    from news_post_votes
    where post_type = ptype and post_uid = any(uids)
    group by post_uid
  ) v on v.post_uid = u.post_uid
  left join (
    select post_uid, count(*) as views
    from news_post_views
    where post_type = ptype and post_uid = any(uids)
    group by post_uid
  ) w on w.post_uid = u.post_uid
  left join (
    select post_uid, count(*) as comments
    from news_post_comments
    where post_type = ptype and post_uid = any(uids) and removed_at is null
    group by post_uid
  ) c on c.post_uid = u.post_uid
  left join (
    select post_uid, count(*) as shares
    from news_post_shares
    where post_type = ptype and post_uid = any(uids)
    group by post_uid
  ) s on s.post_uid = u.post_uid;
$$;

grant execute on function get_news_post_stats(text, text[]) to anon, authenticated;

create or replace function record_share(ptype text, uid text, visitor text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if visitor is null or length(visitor) = 0 then
    raise exception 'visitor id required';
  end if;
  if ptype not in ('news', 'analysis') then
    raise exception 'invalid post_type: %', ptype;
  end if;

  insert into news_post_shares (post_type, post_uid, visitor_id)
  values (ptype, uid, visitor);
end;
$$;

grant execute on function record_share(text, text, text) to anon, authenticated;
