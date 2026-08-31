-- Adds moderator-issued bans and a proper rate limit, replacing the
-- flawed "one comment per 10 seconds, period" guard removed in
-- 0006_relax_comment_flood_guard.sql. Both checks move into a trigger
-- rather than living in RLS's WITH CHECK - a trigger can raise a specific,
-- readable error message, whereas an RLS violation is always the same
-- generic "new row violates row-level security policy" text no matter
-- which condition failed. That generic message is exactly what made the
-- earlier bug ("why can't I reply?!") hard to diagnose from the outside.

alter table profiles add column if not exists banned_until timestamptz;

-- Shared by both the comment and report triggers below, so a banned user
-- can't retaliate via mass-reporting either. security definer isn't
-- strictly required (profiles is already publicly readable), but keeps
-- this consistent with is_moderator() and safe against that policy ever
-- narrowing later.
create or replace function is_banned()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select banned_until > now() from profiles where user_id = auth.uid()),
    false
  );
$$;

grant execute on function is_banned() to authenticated;

-- Replaces set_and_check_comment_depth(): same depth logic, plus a ban
-- check and a rolling rate limit - max 5 comments per 30 seconds. That
-- comfortably allows a normal "comment, then immediately reply" burst
-- (which is exactly what the old fixed 10-second cooldown broke) while
-- still blocking a script posting far faster than any human types.
-- security definer so the rate-limit count sees a user's true recent
-- posting activity including comments a moderator has since removed -
-- otherwise a spammer whose posts get cleaned up quickly could keep
-- posting indefinitely without ever tripping the limit.
create or replace function check_comment_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  parent_depth smallint;
  recent_count int;
begin
  if is_banned() then
    raise exception 'You are currently banned from commenting.';
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

drop trigger if exists news_post_comments_set_depth on news_post_comments;

create trigger news_post_comments_set_depth
  before insert on news_post_comments
  for each row execute function check_comment_before_insert();

-- Blocks a banned user from filing new reports too, so a ban actually
-- stops someone from being disruptive rather than just redirecting it.
create or replace function check_report_before_insert()
returns trigger
language plpgsql
as $$
begin
  if is_banned() then
    raise exception 'You are currently banned and cannot report comments.';
  end if;
  return new;
end;
$$;

drop trigger if exists news_comment_reports_check_ban on news_comment_reports;

create trigger news_comment_reports_check_ban
  before insert on news_comment_reports
  for each row execute function check_report_before_insert();

-- Lets a moderator ban the author of a comment for a fixed number of days,
-- or permanently (duration_days null - stored as timestamptz 'infinity',
-- which always compares greater than now()). Unbanning is a manual SQL
-- update for now, same as adding a moderator:
--   update profiles set banned_until = null where user_id = '...';
create or replace function ban_user(target_user_id uuid, duration_days int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_moderator() then
    raise exception 'not a moderator';
  end if;

  update profiles
  set banned_until = case
    when duration_days is null then 'infinity'::timestamptz
    else now() + (duration_days || ' days')::interval
  end
  where user_id = target_user_id;

  if not found then
    raise exception 'user not found';
  end if;
end;
$$;

grant execute on function ban_user(uuid, int) to authenticated;

-- Superseded by check_comment_before_insert() above - no longer referenced
-- by any trigger.
drop function if exists set_and_check_comment_depth();
