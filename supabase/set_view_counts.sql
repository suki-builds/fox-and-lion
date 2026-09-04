-- Reusable template for manually setting view counts on any number of
-- News/Analysis posts in one go. Fill in the `targets` list below, then run
-- the whole script in the Supabase SQL Editor. Safe to reuse for future
-- batches - just clear out the old rows and fill in new ones each time.
--
-- post_type: 'news' or 'analysis' - the post's actual Prismic custom type,
--   not just which section of the site it looks like it belongs to.
-- post_uid: the slug from the post's URL (the "foo-bar" in /analysis/foo-bar
--   or /news/foo-bar).
-- target_views: the view count you want that post to show.
--
-- Each row in news_post_views is one view - there's no count column to
-- overwrite - so "setting" a count means inserting enough synthetic rows to
-- reach it. This tops up to the target using a live count subquery (same
-- pattern as supabase/fix_analysis_view_count_gaps.sql), so it's safe to
-- run more than once: a post already at or above its target gets nothing
-- inserted for it. This only ever adds rows, never removes - if a post is
-- already above the target you give it here, its count won't go down (see
-- ADMIN_TASKS.md for how to remove views instead, if you actually need to
-- lower one).

with targets (post_type, post_uid, target_views) as (
  values
    ('analysis', 'replace-with-a-real-uid', 1000),
    ('news', 'replace-with-a-real-uid', 500)
    -- add or remove (post_type, post_uid, target_views) rows as needed
)
insert into news_post_views (post_type, post_uid, visitor_id)
select t.post_type, t.post_uid, gen_random_uuid()::text
from targets t
cross join lateral generate_series(
  1,
  greatest(0, t.target_views - (
    select count(*) from news_post_views v
    where v.post_type = t.post_type and v.post_uid = t.post_uid
  ))
);

-- Verify the result:
with targets (post_type, post_uid, target_views) as (
  values
    ('analysis', 'replace-with-a-real-uid', 1000),
    ('news', 'replace-with-a-real-uid', 500)
)
select
  t.post_type,
  t.post_uid,
  t.target_views,
  (select count(*) from news_post_views v
   where v.post_type = t.post_type and v.post_uid = t.post_uid) as actual_views
from targets t;
