-- Persists each News post's scraped thumbnail (og:image + site name from
-- its source article) instead of live-scraping on every page render. See
-- lib/newsThumbnails.js: populated once per post via the Prismic publish
-- webhook (app/api/revalidate/route.js) and, as a self-healing fallback
-- for any gap, opportunistically by getBatchedThumbnails() itself -
-- rather than re-fetched from 20+ external sites on every /news
-- regeneration, which is what caused both a real outage (a batch of
-- concurrent scrapes timed out and got stuck cached as "no image" for a
-- full 24h under the old unstable_cache-based approach) and slow page
-- loads (the whole page waited on whichever of 20 external sites was
-- slowest). See scripts/backfill-news-thumbnails.mjs for the one-time
-- backfill of posts that existed before this table did.
--
-- image_url is nullable and a NULL is itself a meaningful, cached answer -
-- "checked, this article genuinely has no og:image" - distinct from "not
-- yet scraped", which is the total absence of a row for a post_uid.
--
-- Run after 0017_ats_jobs.sql, in the Supabase SQL Editor - same as every
-- other file in this folder.

create table if not exists news_post_thumbnails (
  post_uid text primary key,
  image_url text,
  site_name text,
  scraped_at timestamptz not null default now()
);

alter table news_post_thumbnails enable row level security;

-- Public read only, same pattern as ats_jobs - writes only ever come from
-- the service-role key (the webhook and the backfill script), so there's
-- deliberately no insert/update/delete policy for anon/authenticated here.
create policy "Anyone can read news thumbnails"
  on news_post_thumbnails for select
  using (true);
