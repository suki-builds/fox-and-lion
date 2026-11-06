-- Guest comments: readers can comment with just a display name, no account.
-- Run after 0025_top_viewed_posts.sql, in the Supabase SQL Editor - same as
-- the other migrations, nothing here is applied automatically.
--
-- Safe to run more than once - if you ran an earlier version of this file,
-- just run it again.
--
-- Safe to run while the current production site is live: signed-in
-- commenting works exactly as before, and the old site simply shows any
-- guest comment as "Fox and Lion reader".
--
-- Guests never insert directly. The browser can't: the insert policy from
-- 0006 requires auth.uid() = user_id, which a null user_id never satisfies.
-- Instead app/api/guest-comment/route.js runs the spam and profanity checks
-- and calls insert_guest_comment() below with the service-role key, so
-- there's no way to post a guest comment that skips those checks.
--
-- A comment the filters flag is "held": stored with removed_at set and
-- removed_reason 'held for review'. That reuses everything that already
-- hides removed comments - the public read policy, the comment counts in
-- get_news_post_stats - and moderate_comment() approves it ('restore') or
-- rejects it ('remove') from /moderation without any new RPC.

alter table news_post_comments alter column user_id drop not null;

alter table news_post_comments add column if not exists guest_name text;

-- Exactly one of the two: an account, or a guest name.
alter table news_post_comments
  drop constraint if exists news_post_comments_author_check;

alter table news_post_comments
  add constraint news_post_comments_author_check
  check (
    (user_id is not null and guest_name is null)
    or (user_id is null and char_length(guest_name) between 2 and 40)
  );

-- Kept out of news_post_comments on purpose: that table is publicly
-- readable with select *, and the guest's email, hashed IP and filter
-- results are not for the public. No insert/update policies - only
-- insert_guest_comment() writes here.
create table if not exists news_comment_guest_meta (
  comment_id uuid primary key references news_post_comments(id) on delete cascade,
  email text,
  key_hash text not null,
  flag_reasons text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- For anyone who ran the first version of this file, which had no email.
-- Nullable only so those earlier rows stay valid; insert_guest_comment()
-- always sets it.
alter table news_comment_guest_meta add column if not exists email text;

create index if not exists news_comment_guest_meta_key_created_idx
  on news_comment_guest_meta (key_hash, created_at);

alter table news_comment_guest_meta enable row level security;

drop policy if exists "Moderators can read guest comment meta" on news_comment_guest_meta;

create policy "Moderators can read guest comment meta"
  on news_comment_guest_meta for select
  using (is_moderator());

-- Same as 0009's version, except the account checks (ban, username, the
-- per-user rate limit) only apply to signed-in comments. Guest comments are
-- rate limited inside insert_guest_comment() instead, by hashed IP.
create or replace function check_comment_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  parent_depth smallint;
  recent_count int;
  has_username boolean;
begin
  if new.user_id is not null then
    if is_banned() then
      raise exception 'You are currently banned from commenting.';
    end if;

    select (username is not null) into has_username
    from profiles where user_id = auth.uid();

    if not coalesce(has_username, false) then
      raise exception 'Please set a username on your account page before commenting.';
    end if;

    select count(*) into recent_count
    from news_post_comments
    where user_id = auth.uid()
      and created_at > now() - interval '30 seconds';

    if recent_count >= 5 then
      raise exception 'You are commenting too quickly - please wait a moment and try again.';
    end if;
  end if;

  if new.parent_id is null then
    new.depth := 0;
  else
    select depth into parent_depth
    from news_post_comments
    where id = new.parent_id;

    if parent_depth is null then
      raise exception 'parent comment % does not exist', new.parent_id;
    end if;

    if parent_depth >= 4 then
      raise exception 'comment threading is capped at 5 levels';
    end if;

    new.depth := parent_depth + 1;
  end if;

  return new;
end;
$$;

-- Inserts a guest comment and its meta row together, after a rate limit of
-- 3 comments per 10 minutes and 20 per day for each hashed IP. Counts held
-- comments too, so a spammer whose posts are all being held still runs into
-- the limit. Callable only with the service-role key - see the revokes.
-- The first version of this file had no email parameter. Postgres would
-- keep that one alongside the new one as an overload, so drop it.
drop function if exists insert_guest_comment(text, text, uuid, text, text, text, text[]);

create or replace function insert_guest_comment(
  p_post_uid text,
  p_post_type text,
  p_parent_id uuid,
  p_guest_name text,
  p_guest_email text,
  p_body text,
  p_key_hash text,
  p_flag_reasons text[]
)
returns news_post_comments
language plpgsql
security definer
set search_path = public
as $$
declare
  held boolean := coalesce(array_length(p_flag_reasons, 1), 0) > 0;
  new_comment news_post_comments;
begin
  if p_guest_email is null or p_guest_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'A valid email address is required.';
  end if;

  if (
    select count(*) from news_comment_guest_meta
    where key_hash = p_key_hash and created_at > now() - interval '10 minutes'
  ) >= 3 or (
    select count(*) from news_comment_guest_meta
    where key_hash = p_key_hash and created_at > now() - interval '1 day'
  ) >= 20 then
    raise exception 'You are commenting too quickly - please wait a while and try again.';
  end if;

  insert into news_post_comments (
    post_uid, post_type, parent_id, guest_name, body,
    removed_at, removed_reason
  )
  values (
    p_post_uid, p_post_type, p_parent_id, p_guest_name, p_body,
    case when held then now() end,
    case when held then 'held for review' end
  )
  returning * into new_comment;

  insert into news_comment_guest_meta (comment_id, email, key_hash, flag_reasons)
  values (new_comment.id, lower(p_guest_email), p_key_hash, coalesce(p_flag_reasons, '{}'));

  return new_comment;
end;
$$;

revoke execute on function insert_guest_comment(text, text, uuid, text, text, text, text, text[])
  from public, anon, authenticated;
grant execute on function insert_guest_comment(text, text, uuid, text, text, text, text, text[])
  to service_role;
