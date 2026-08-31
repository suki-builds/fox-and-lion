-- Switches view counting from "one view per visitor per post, ever" to
-- "every page load counts" (raw page views, not unique visitors) - the
-- unique (post_uid, visitor_id) constraint from 0002 was the only thing
-- deduping repeat visits, so dropping it and dropping record_view()'s
-- ON CONFLICT DO NOTHING is the whole change. get_news_post_stats() already
-- does count(*) over news_post_views, so it needs no changes - it'll just
-- start reflecting the true row count once rows are no longer deduped.
--
-- visitor_id is kept (not dropped) even though it's no longer used for
-- dedup - still useful context on each row if this needs revisiting.

alter table news_post_views drop constraint if exists news_post_views_post_uid_visitor_id_key;

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
  values (uid, visitor);
end;
$$;

grant execute on function record_view(text, text) to anon, authenticated;
