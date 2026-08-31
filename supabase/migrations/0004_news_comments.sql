-- Threaded comments for News posts. Run after 0003_profiles.sql, in the
-- Supabase SQL Editor - same as the other migrations, nothing here is
-- applied automatically.

create table if not exists news_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_uid text not null,
  parent_id uuid references news_post_comments(id) on delete cascade,
  depth smallint not null default 0,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  edited_at timestamptz,
  removed_at timestamptz,
  removed_by uuid references auth.users(id),
  removed_reason text
);

create index if not exists news_post_comments_post_uid_idx
  on news_post_comments (post_uid);

create index if not exists news_post_comments_parent_id_idx
  on news_post_comments (parent_id);

-- Computes depth from the parent and hard-caps threading at 5 levels
-- (0..4). This is a deliberate product decision, not a technical
-- limitation - a self-referencing parent_id is exactly as cheap at 20
-- levels as at 1, but deeper threads mostly turn into unproductive
-- back-and-forth rather than adding anything. Enforced here (not just by
-- hiding the reply button client-side) so it can't be bypassed by calling
-- the API directly.
create or replace function set_and_check_comment_depth()
returns trigger
language plpgsql
as $$
declare
  parent_depth smallint;
begin
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
  for each row execute function set_and_check_comment_depth();

alter table news_post_comments enable row level security;

-- Public read for anything not removed - matches votes' public score.
-- Moderators can also see removed comments (is_moderator() is defined in
-- 0005_comment_reports_and_moderation.sql - this policy is created there,
-- after that function exists, so moderators aren't granted visibility
-- until both migrations have run).
create policy "Comments are publicly readable"
  on news_post_comments for select
  using (removed_at is null);

-- Authenticated only, must post as themselves, plus a lightweight flood
-- guard: no more than one comment every 10 seconds per user. Not a full
-- rate-limiting solution, just enough to blunt accidental double-submits
-- and casual flooding.
create policy "Users can insert own comment"
  on news_post_comments for insert
  with check (
    auth.uid() = user_id
    and not exists (
      select 1 from news_post_comments
      where user_id = auth.uid()
        and created_at > now() - interval '10 seconds'
    )
  );

-- No update/delete policies - all mutations go through the security
-- definer RPCs below, so every write path is auditable in one place
-- instead of column-level RLS (e.g. a user editing their own body vs a
-- moderator clearing removed_at need different permission checks on the
-- same row).

create or replace function edit_own_comment(comment_id uuid, new_body text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update news_post_comments
  set body = new_body,
      edited_at = now(),
      updated_at = now()
  where id = comment_id
    and user_id = auth.uid()
    and removed_at is null;

  if not found then
    raise exception 'comment not found, not yours, or already removed';
  end if;
end;
$$;

grant execute on function edit_own_comment(uuid, text) to authenticated;

create or replace function delete_own_comment(comment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update news_post_comments
  set removed_at = now(),
      removed_by = auth.uid(),
      removed_reason = 'deleted by author'
  where id = comment_id
    and user_id = auth.uid()
    and removed_at is null;

  if not found then
    raise exception 'comment not found, not yours, or already removed';
  end if;
end;
$$;

grant execute on function delete_own_comment(uuid) to authenticated;
