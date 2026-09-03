-- Extends votes/views/comments to Analysis posts, not just News. Prismic
-- only guarantees UID uniqueness *within* a custom type, not across types,
-- so once two different content types can write into these tables a bare
-- post_uid isn't safe to key on alone - a News post and an Analysis post
-- could in principle share the same uid string. post_type disambiguates
-- that. Every existing row defaults to 'news', which is what it always
-- was - no data backfill needed beyond the column default.
--
-- Run after 0014_seed_new_post_score.sql, in the Supabase SQL Editor -
-- same as every other file in this folder.

alter table news_post_votes
  add column if not exists post_type text not null default 'news'
    check (post_type in ('news', 'analysis'));

alter table news_post_views
  add column if not exists post_type text not null default 'news'
    check (post_type in ('news', 'analysis'));

alter table news_post_comments
  add column if not exists post_type text not null default 'news'
    check (post_type in ('news', 'analysis'));

-- A user's vote is now unique per (content type, uid), not just uid - so a
-- News post and an Analysis post that happen to share a uid string get
-- independent vote rows instead of colliding on one. No RLS policy
-- changes needed anywhere in this file - none of the existing policies on
-- these three tables reference post_uid, only user_id/visitor_id/
-- removed_at/is_moderator(), so they're unaffected by this column.
alter table news_post_votes
  drop constraint if exists news_post_votes_post_uid_user_id_key;
alter table news_post_votes
  add constraint news_post_votes_post_type_post_uid_user_id_key
  unique (post_type, post_uid, user_id);

-- get_news_post_stats and record_view both take an explicit post_type
-- argument now instead of assuming "news" - every call site (News list,
-- News detail, homepage, and now Analysis list/detail) passes it
-- explicitly. Signatures changed, so the old versions are dropped first.

drop function if exists get_news_post_stats(text[]);

create or replace function get_news_post_stats(ptype text, uids text[])
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
  ) c on c.post_uid = u.post_uid;
$$;

grant execute on function get_news_post_stats(text, text[]) to anon, authenticated;

drop function if exists record_view(text, text);

create or replace function record_view(ptype text, uid text, visitor text)
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

  insert into news_post_views (post_type, post_uid, visitor_id)
  values (ptype, uid, visitor);
end;
$$;

grant execute on function record_view(text, text, text) to anon, authenticated;
