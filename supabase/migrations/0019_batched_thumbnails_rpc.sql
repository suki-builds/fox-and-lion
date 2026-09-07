-- getBatchedThumbnails() (lib/newsThumbnails.js) was querying
-- news_post_thumbnails via `.in('post_uid', uids)` - PostgREST encodes an
-- `.in()` filter into the request URL's query string, and with the full
-- News list (300+ posts) that URL exceeds ~16KB, well past the HTTP
-- header/URL size most servers (and the undici HTTP client Supabase-js
-- uses) accept. The request failed outright (HeadersOverflowError), the
-- query's null result was silently read as "zero rows found", and every
-- single post fell through to the live-scrape fallback on every render -
-- the exact unbounded-concurrency problem this whole system exists to
-- avoid, just worse (300+-way instead of 20-way).
--
-- Same fix Supabase's own error message points at, and the same pattern
-- get_news_post_stats() already uses for exactly this reason: an RPC
-- function sends its arguments in the POST body, not the URL, so the
-- array size no longer matters.
--
-- Run after 0018_news_post_thumbnails.sql, in the Supabase SQL Editor -
-- same as every other file in this folder.

create or replace function get_news_post_thumbnails(uids text[])
returns table (post_uid text, image_url text, site_name text)
language sql
stable
as $$
  select post_uid, image_url, site_name
  from news_post_thumbnails
  where post_uid = any(uids);
$$;

grant execute on function get_news_post_thumbnails(text[]) to anon, authenticated;
