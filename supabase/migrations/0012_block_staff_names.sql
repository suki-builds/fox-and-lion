-- Extends is_username_blocked() (see 0009_usernames.sql) to also cover
-- impersonation of actual team members, not just role words like
-- "admin"/"mod". Same normalization as before (strip non-alphanumerics,
-- lowercase) so spacing/punctuation/casing can't dodge it - "So-Hyun Park",
-- "SOHYUNPARK", and "so hyun park" all normalize to "sohyunpark".

create or replace function is_username_blocked(candidate text)
returns boolean
language sql
immutable
as $$
  select regexp_replace(lower(candidate), '[^a-z0-9]', '', 'g')
    ~ '(admin|mod|foxandlion|sohyunpark|jinhyunglee|sukipark)';
$$;
