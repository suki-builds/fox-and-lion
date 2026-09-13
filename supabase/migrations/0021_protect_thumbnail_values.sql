-- Stops a stored thumbnail or source name ever being replaced with NULL.
--
-- On 2026-09-13 at 16:02 UTC every row in this table had image_url and
-- site_name overwritten with NULL in one burst. A /news regeneration got no
-- result back from get_news_post_thumbnails (the error was being
-- discarded), treated all ~439 posts as missing, scraped them all at once,
-- and every scrape failed. lib/ogImage.js reports a failed scrape as NULLs -
-- the same thing it reports for a page with no og:image - and the write path
-- upserted those NULLs over the good values.
--
-- lib/newsThumbnails.js no longer does that. This makes the rule hold in the
-- database as well, for every writer - the app, scripts/, the webhook, a
-- future bug - so a NULL can only ever fill a gap, never erase a value.
-- A non-NULL update still goes through, so a source article that changes
-- its og:image is still picked up.
--
-- To deliberately clear a value (rare), do it with the trigger disabled:
--   alter table news_post_thumbnails disable trigger news_post_thumbnails_keep_known_values;
--   update news_post_thumbnails set image_url = null where post_uid = '...';
--   alter table news_post_thumbnails enable trigger news_post_thumbnails_keep_known_values;

create or replace function news_post_thumbnails_keep_known_values()
returns trigger
language plpgsql
as $$
begin
  new.image_url := coalesce(new.image_url, old.image_url);
  new.site_name := coalesce(new.site_name, old.site_name);
  return new;
end;
$$;

drop trigger if exists news_post_thumbnails_keep_known_values on news_post_thumbnails;

create trigger news_post_thumbnails_keep_known_values
before update on news_post_thumbnails
for each row
execute function news_post_thumbnails_keep_known_values();
