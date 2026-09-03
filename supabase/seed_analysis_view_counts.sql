-- One-time backfill: gives every existing Analysis post a baseline view
-- count, normally distributed (mean 550, stddev 150) and clamped to
-- [100, 1000], same approach as seed_view_counts.sql for News - so organic
-- views (via ViewTracker.js) add on top of a realistic-looking starting
-- point rather than everything showing 0.
--
-- Two exceptions get a viral-sized count instead (10,000-15,000): both
-- "The Defense-Tech Bubble is Headed for Consolidation" documents -
-- yes, there are two (see the near-identical uids below), a pre-existing
-- Prismic content duplicate, not something this script created. It hit
-- Hacker News and got a Substack shoutout from Pete Modigliani, hence the
-- much higher number on both copies rather than sorting out which one is
-- canonical.
--
-- NOT a schema migration - a one-off data seed. Safe to run once; the
-- guard below ("where not exists") skips any post that already has at
-- least one view row for post_type = 'analysis' and that uid, so
-- accidentally running this twice won't double every count. Generated
-- from the live Prismic Analysis list at the time this was written - a
-- post added after this runs just starts at 0 and accrues organic views
-- normally, same as before this backfill existed.

insert into news_post_views (post_type, post_uid, visitor_id)
select 'analysis', 'uncomfortable-lessons-of-the-iran-war', gen_random_uuid()::text
from generate_series(1, 543)
where not exists (select 1 from news_post_views where post_type = 'analysis' and post_uid = 'uncomfortable-lessons-of-the-iran-war');

insert into news_post_views (post_type, post_uid, visitor_id)
select 'analysis', 'britain-lacks-obvious-choice-for-new-fast-jet-trainer', gen_random_uuid()::text
from generate_series(1, 619)
where not exists (select 1 from news_post_views where post_type = 'analysis' and post_uid = 'britain-lacks-obvious-choice-for-new-fast-jet-trainer');

insert into news_post_views (post_type, post_uid, visitor_id)
select 'analysis', 'how-did-it-come-to-this', gen_random_uuid()::text
from generate_series(1, 520)
where not exists (select 1 from news_post_views where post_type = 'analysis' and post_uid = 'how-did-it-come-to-this');

insert into news_post_views (post_type, post_uid, visitor_id)
select 'analysis', 'lessons-from-ukraine-industrial-base-is-power', gen_random_uuid()::text
from generate_series(1, 817)
where not exists (select 1 from news_post_views where post_type = 'analysis' and post_uid = 'lessons-from-ukraine-industrial-base-is-power');

insert into news_post_views (post_type, post_uid, visitor_id)
select 'analysis', 'the-golden-hour-is-dead', gen_random_uuid()::text
from generate_series(1, 517)
where not exists (select 1 from news_post_views where post_type = 'analysis' and post_uid = 'the-golden-hour-is-dead');

insert into news_post_views (post_type, post_uid, visitor_id)
select 'analysis', 'what-even-was-that', gen_random_uuid()::text
from generate_series(1, 697)
where not exists (select 1 from news_post_views where post_type = 'analysis' and post_uid = 'what-even-was-that');

insert into news_post_views (post_type, post_uid, visitor_id)
select 'analysis', 'stop-clutching-your-fpv-drones', gen_random_uuid()::text
from generate_series(1, 403)
where not exists (select 1 from news_post_views where post_type = 'analysis' and post_uid = 'stop-clutching-your-fpv-drones');

insert into news_post_views (post_type, post_uid, visitor_id)
select 'analysis', 'pulling-5000-troops-from-germany-is-not-a-big-deal', gen_random_uuid()::text
from generate_series(1, 401)
where not exists (select 1 from news_post_views where post_type = 'analysis' and post_uid = 'pulling-5000-troops-from-germany-is-not-a-big-deal');

insert into news_post_views (post_type, post_uid, visitor_id)
select 'analysis', 'post-service-ego-death-a-semi-psychotic-guide-to-success-after-the-military', gen_random_uuid()::text
from generate_series(1, 660)
where not exists (select 1 from news_post_views where post_type = 'analysis' and post_uid = 'post-service-ego-death-a-semi-psychotic-guide-to-success-after-the-military');

insert into news_post_views (post_type, post_uid, visitor_id)
select 'analysis', 'the-unsexy-infrastructure-that-wins-drone-wars', gen_random_uuid()::text
from generate_series(1, 286)
where not exists (select 1 from news_post_views where post_type = 'analysis' and post_uid = 'the-unsexy-infrastructure-that-wins-drone-wars');

insert into news_post_views (post_type, post_uid, visitor_id)
select 'analysis', 'the-kill-chain-has-a-thinking-problem', gen_random_uuid()::text
from generate_series(1, 401)
where not exists (select 1 from news_post_views where post_type = 'analysis' and post_uid = 'the-kill-chain-has-a-thinking-problem');

insert into news_post_views (post_type, post_uid, visitor_id)
select 'analysis', 'from-alliance-to-industrial-fusion-what-trumps-shipbuilding-memo-means-for-korea', gen_random_uuid()::text
from generate_series(1, 191)
where not exists (select 1 from news_post_views where post_type = 'analysis' and post_uid = 'from-alliance-to-industrial-fusion-what-trumps-shipbuilding-memo-means-for-korea');

insert into news_post_views (post_type, post_uid, visitor_id)
select 'analysis', 'the-defense-tech-bubble-is-headed-for-consolidation', gen_random_uuid()::text
from generate_series(1, 14823)
where not exists (select 1 from news_post_views where post_type = 'analysis' and post_uid = 'the-defense-tech-bubble-is-headed-for-consolidation');

insert into news_post_views (post_type, post_uid, visitor_id)
select 'analysis', 'defense-tech-bubble-is-headed-for-consolidation', gen_random_uuid()::text
from generate_series(1, 13657)
where not exists (select 1 from news_post_views where post_type = 'analysis' and post_uid = 'defense-tech-bubble-is-headed-for-consolidation');

-- 14 posts seeded, 34535 synthetic view rows total.
