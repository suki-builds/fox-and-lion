-- Self-chosen usernames, which replace the visitor's real Google name in
-- comments (this audience is often military/government-adjacent, so name
-- privacy matters). Once this is applied, a username is required before
-- posting a comment - see the updated check_comment_before_insert() at the
-- bottom, which supersedes the version from 0008_bans_and_rate_limit.sql.

alter table profiles add column if not exists username text;

alter table profiles
  drop constraint if exists profiles_username_format;

alter table profiles
  add constraint profiles_username_format
  check (username is null or username ~ '^[A-Za-z0-9_]{3,20}$');

create unique index if not exists profiles_username_unique_idx
  on profiles (lower(username))
  where username is not null;

-- Blocks impersonation-style names. Normalizes first (strip everything but
-- letters/digits, lowercase) so casing, spacing, and punctuation can't be
-- used to dodge the list - "Fox_And-Lion", "FOXANDLION99", and "fox and
-- lion" all normalize to contain "foxandlion". Deliberately broad (e.g.
-- "mod" also catches "moderator", "modteam") - a false positive just means
-- picking a different name, which is a much smaller cost than someone
-- successfully posing as staff.
create or replace function is_username_blocked(candidate text)
returns boolean
language sql
immutable
as $$
  select regexp_replace(lower(candidate), '[^a-z0-9]', '', 'g')
    ~ '(admin|mod|foxandlion)';
$$;

create or replace function set_username(new_username text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;

  if new_username !~ '^[A-Za-z0-9_]{3,20}$' then
    raise exception 'Usernames must be 3-20 characters: letters, numbers, and underscores only.';
  end if;

  if is_username_blocked(new_username) then
    raise exception 'That username isn''t available - please choose something else.';
  end if;

  if exists (
    select 1 from profiles
    where lower(username) = lower(new_username) and user_id <> auth.uid()
  ) then
    raise exception 'That username is already taken.';
  end if;

  update profiles
  set username = new_username, updated_at = now()
  where user_id = auth.uid();
end;
$$;

grant execute on function set_username(text) to authenticated;

-- Same as 0008's version, plus: a username is now required to comment.
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
