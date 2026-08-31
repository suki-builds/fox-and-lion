-- Works around a persistent PostgREST issue: news_post_views' anon table
-- grant and RLS policy were both confirmed correct at the database level
-- (see 0010) - checked directly via pg_policy and information_schema - yet
-- PostgREST kept rejecting anonymous inserts with a generic RLS-violation
-- error even after a schema cache reload (NOTIFY pgrst, 'reload schema').
--
-- Routing this through a security-definer RPC sidesteps the mystery
-- entirely rather than depending on a reload/restart actually clearing it:
-- function-level grants have been reliable via PostgREST throughout this
-- project (is_moderator(), moderate_comment(), set_username()) in exactly
-- the way the raw table grant here has not been.
create or replace function record_view(uid text, visitor text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if visitor is null or length(visitor) = 0 then
    raise exception 'visitor id required';
  end if;

  insert into news_post_views (post_uid, visitor_id)
  values (uid, visitor)
  on conflict (post_uid, visitor_id) do nothing;
end;
$$;

grant execute on function record_view(text, text) to anon, authenticated;
