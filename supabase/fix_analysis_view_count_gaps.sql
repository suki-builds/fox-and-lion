-- Fixup for seed_analysis_view_counts.sql: 5 of its 12 regular posts got
-- silently under-seeded. That script's "where not exists (any row)" guard
-- was meant to stop it from double-running, but the site is live and
-- getting real traffic - by the time it was actually run, these 5 posts
-- had each already picked up a handful of genuine (or my own testing)
-- views, which was enough to trip the guard and skip the entire baseline
-- insert for that post, leaving it stuck in the single digits instead of
-- its intended 100-1000 baseline.
--
-- This tops each one up to its original target using a live subquery for
-- the shortfall (target - current count, floored at 0), so it's safe to
-- run regardless of exactly how many organic views have landed since -
-- no double-counting, no guard to trip.

insert into news_post_views (post_type, post_uid, visitor_id)
select 'analysis', 'britain-lacks-obvious-choice-for-new-fast-jet-trainer', gen_random_uuid()::text
from generate_series(1, greatest(0, 619 - (
  select count(*) from news_post_views
  where post_type = 'analysis' and post_uid = 'britain-lacks-obvious-choice-for-new-fast-jet-trainer'
)));

insert into news_post_views (post_type, post_uid, visitor_id)
select 'analysis', 'what-even-was-that', gen_random_uuid()::text
from generate_series(1, greatest(0, 697 - (
  select count(*) from news_post_views
  where post_type = 'analysis' and post_uid = 'what-even-was-that'
)));

insert into news_post_views (post_type, post_uid, visitor_id)
select 'analysis', 'post-service-ego-death-a-semi-psychotic-guide-to-success-after-the-military', gen_random_uuid()::text
from generate_series(1, greatest(0, 660 - (
  select count(*) from news_post_views
  where post_type = 'analysis' and post_uid = 'post-service-ego-death-a-semi-psychotic-guide-to-success-after-the-military'
)));

insert into news_post_views (post_type, post_uid, visitor_id)
select 'analysis', 'the-unsexy-infrastructure-that-wins-drone-wars', gen_random_uuid()::text
from generate_series(1, greatest(0, 286 - (
  select count(*) from news_post_views
  where post_type = 'analysis' and post_uid = 'the-unsexy-infrastructure-that-wins-drone-wars'
)));

insert into news_post_views (post_type, post_uid, visitor_id)
select 'analysis', 'the-kill-chain-has-a-thinking-problem', gen_random_uuid()::text
from generate_series(1, greatest(0, 401 - (
  select count(*) from news_post_views
  where post_type = 'analysis' and post_uid = 'the-kill-chain-has-a-thinking-problem'
)));
