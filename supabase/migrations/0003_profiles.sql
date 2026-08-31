-- Public profile data synced from auth.users. Run this in the Supabase SQL
-- Editor - same as 0001/0002, nothing here is applied automatically.
--
-- Votes and views never had to show *who* acted, only aggregate counts, so
-- nothing before this exposed a signed-in user's name/avatar to anyone else
-- (auth.users itself isn't queryable by other users at all - no grants on
-- it exist for anon/authenticated). Comments are the first feature that
-- needs to show another visitor's identity, hence this table.

create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- Publicly readable (a comment's author name/avatar has to be visible to
-- every visitor, signed in or not) - but never publicly writable. The only
-- writer is the trigger below.
create policy "Profiles are publicly readable"
  on profiles for select
  using (true);

-- Keeps profiles in sync with auth.users - same fields SiteHeader.js already
-- reads off the session user (user_metadata.full_name/name,
-- avatar_url/picture), just persisted somewhere other users can read them
-- from. security definer since regular users have no write access to
-- auth.users or (by the policy above) to other rows in profiles.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (user_id) do update
    set display_name = excluded.display_name,
        avatar_url = excluded.avatar_url,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert or update on auth.users
  for each row execute function handle_new_user();

-- One-time backfill for anyone who signed in before this migration ran -
-- the trigger only covers insert/update from this point on. Harmless to
-- re-run; on conflict does nothing since a real sign-in will refresh it via
-- the trigger anyway.
insert into public.profiles (user_id, display_name, avatar_url)
select
  id,
  coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name'),
  coalesce(raw_user_meta_data->>'avatar_url', raw_user_meta_data->>'picture')
from auth.users
on conflict (user_id) do nothing;
