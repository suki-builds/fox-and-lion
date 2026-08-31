-- Comment reporting and moderation. Run after 0004_news_comments.sql, in
-- the Supabase SQL Editor - same as the other migrations, nothing here is
-- applied automatically.

-- Membership is managed by hand, the same way every other piece of this
-- project without a CLI migration runner is: run an insert directly in the
-- SQL Editor to add a moderator, e.g.
--   insert into moderators (user_id) values ('<their auth.users id>');
-- No policies at all below - this table is fully locked down, readable
-- only through the is_moderator() function.
create table if not exists moderators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz not null default now(),
  added_by uuid references auth.users(id)
);

alter table moderators enable row level security;

create or replace function is_moderator()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from moderators where user_id = auth.uid());
$$;

grant execute on function is_moderator() to authenticated;

-- Now that is_moderator() exists, moderators can also see removed comments
-- (needed for the moderation dashboard to review/restore them) - regular
-- visitors still only get the "not removed" policy from 0004.
create policy "Moderators can read all comments"
  on news_post_comments for select
  using (is_moderator());

create table if not exists news_comment_reports (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references news_post_comments(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason_code text not null check (
    reason_code in ('spam', 'harassment', 'off_topic', 'misinformation', 'other')
  ),
  detail text check (detail is null or char_length(detail) <= 500),
  status text not null default 'open' check (status in ('open', 'actioned', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id),
  unique (comment_id, reporter_id)
);

alter table news_comment_reports enable row level security;

-- Anyone signed in can report, as themselves, once per comment.
create policy "Users can report a comment"
  on news_comment_reports for insert
  with check (auth.uid() = reporter_id);

-- Only moderators see or act on the report queue - reporters aren't shown
-- their own report's status.
create policy "Moderators can read reports"
  on news_comment_reports for select
  using (is_moderator());

create policy "Moderators can update reports"
  on news_comment_reports for update
  using (is_moderator());

-- Applies (or reverses) a moderation action on a comment. Doesn't cascade
-- to replies - a removed parent renders as "[removed]" but its replies
-- stay visible, since a fine reply thread shouldn't vanish just because the
-- comment above it got pulled.
create or replace function moderate_comment(comment_id uuid, action text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_moderator() then
    raise exception 'not a moderator';
  end if;

  if action = 'remove' then
    update news_post_comments
    set removed_at = now(),
        removed_by = auth.uid(),
        removed_reason = 'removed by moderator'
    where id = comment_id;
  elsif action = 'restore' then
    update news_post_comments
    set removed_at = null,
        removed_by = null,
        removed_reason = null
    where id = comment_id;
  else
    raise exception 'unknown action: %', action;
  end if;

  if not found then
    raise exception 'comment not found';
  end if;
end;
$$;

grant execute on function moderate_comment(uuid, text) to authenticated;
