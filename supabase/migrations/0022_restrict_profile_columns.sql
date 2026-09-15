-- Stops profiles publishing more than comment rendering needs.
--
-- The "Profiles are publicly readable" policy in 0003 is correct in spirit:
-- a comment's author name and avatar have to be visible to every visitor,
-- signed in or not. But RLS is row-level, so `using (true)` exposes every
-- *column* of every row to anyone holding the anon key - which ships in the
-- browser bundle of every page. That included:
--
--   display_name  - the user's real name, taken from Google at sign-up. 0009
--                   replaced real names with self-chosen usernames in
--                   comments, but left this column populated. Nothing in the
--                   app has read it since: every query names its columns and
--                   selects only user_id / username / avatar_url. So it was a
--                   real name, published, for no feature at all.
--   banned_until  - anyone could enumerate who is banned and until when.
--
-- Column privileges are the right tool: they are enforced by Postgres for the
-- roles PostgREST connects as, so they hold for every route into the database
-- rather than relying on client code selecting the right columns. They also
-- cover WHERE and ORDER BY, since Postgres requires SELECT privilege on any
-- column referenced there - so a hidden column can't be probed with a filter
-- either.
--
-- display_name is dropped rather than merely hidden, because data that isn't
-- stored can't be exposed by a later mistake. Nothing is lost: Google's name
-- still lives in auth.users.raw_user_meta_data, which has no grants for
-- anon/authenticated at all (see the note at the top of 0003).
--
-- One thing to keep in mind when adding to this table later: a security
-- definer function runs as the owner and ignores these grants, so anything
-- that returns a whole profile row would undo this. As of this migration
-- every definer function touching profiles returns boolean or void
-- (is_banned, ban_user, set_username, is_username_blocked).

-- handle_new_user() has to stop writing display_name first: it fires on every
-- insert *and update* of auth.users, so leaving it referencing a dropped
-- column would break sign-in for everyone, not just new users.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (user_id) do update
    set avatar_url = excluded.avatar_url,
        updated_at = now();
  return new;
end;
$$;

alter table profiles drop column if exists display_name;

-- Replace blanket table-level SELECT with the three columns comment
-- rendering actually needs. Revoking from public as well as anon/authenticated
-- covers privileges inherited rather than granted directly; service_role and
-- the table owner are untouched, so server-side reads and the Supabase
-- dashboard still see everything.
revoke select on profiles from public;
revoke select on profiles from anon;
revoke select on profiles from authenticated;

grant select (user_id, username, avatar_url) on profiles to anon;
grant select (user_id, username, avatar_url) on profiles to authenticated;

-- After running this, `select *` on profiles from the browser will fail by
-- design. Every query in the app names its columns:
--   components/CommentThread.js    user_id, username, avatar_url
--   components/ModerationQueue.js  user_id, username
--   app/(public)/account/page.js   username
