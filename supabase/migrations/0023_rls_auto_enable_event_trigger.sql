-- Records the ensure_rls event trigger, which was already live on the
-- database but existed in no migration - so a rebuild from this repo would
-- have silently dropped the safeguard.
--
-- What it does: whenever a table is created in the public schema, RLS is
-- switched on for it immediately. That closes the most common Supabase
-- mistake - create a table, forget RLS, and PostgREST publishes every row to
-- anyone holding the anon key, which ships in the browser bundle. Enabling
-- RLS with no policy denies everything by default, so a new table starts
-- private and opens up only when a policy is deliberately added.
--
-- Two things it deliberately does not do:
--   - it only affects tables created after it, so it is not evidence that
--     existing tables have RLS (they do - verified by reading every table
--     with the anon key on 2026-09-16)
--   - it does not FORCE RLS, so the table owner and service_role still
--     bypass it, which is what server-side reads depend on
--
-- security definer is required (altering a table needs privileges the
-- creating role may not have) and is hardened with a pinned search_path.
-- The function can't be reached through the API: PostgREST exposes it, but
-- Postgres refuses to execute an event_trigger function outside DDL context
-- ("0A000: cannot display a value of type event_trigger"), verified against
-- production with the anon key.

create or replace function public.rls_auto_enable()
returns event_trigger
language plpgsql
security definer
set search_path to 'pg_catalog'
as $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

-- No WHEN TAG filter: the function already filters on command_tag itself, so
-- adding one here would only duplicate that. If the live trigger was created
-- with a WHEN clause, this recreates it without one - same behaviour, since
-- the body ignores every other command tag.
drop event trigger if exists ensure_rls;

create event trigger ensure_rls
  on ddl_command_end
  execute function public.rls_auto_enable();

-- Tidiness rather than security. Postgres grants EXECUTE on every new
-- function to PUBLIC by default, which is where anon and authenticated
-- inherit it. Event triggers don't consult EXECUTE grants - they run as the
-- trigger's owner - so removing these changes nothing about whether the
-- safeguard works, it just stops the function appearing as callable.
revoke execute on function public.rls_auto_enable() from public;
revoke execute on function public.rls_auto_enable() from anon;
revoke execute on function public.rls_auto_enable() from authenticated;
