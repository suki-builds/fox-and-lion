# Manual admin tasks

Recipes for things that don't have (and don't need) an in-app UI. Run these
directly in the Supabase SQL Editor. None of this is applied automatically -
same as the migrations in `supabase/migrations/`.

## Add a moderator

Find the person's id in Auth → Users, then:

```sql
insert into moderators (user_id) values ('<their auth.users id>');
```

## Remove a moderator

```sql
delete from moderators where user_id = '<their auth.users id>';
```

## Unban a user

Bans are otherwise only issued from the moderation queue UI (`/moderation`).

```sql
update profiles set banned_until = null where user_id = '<their auth.users id>';
```

## Manually adjust a News or Analysis post's view count

View counts come from `count(*)` over `news_post_views` rows for that
`(post_type, post_uid)` pair (one row per unique visitor) - see
`supabase/migrations/0015_analysis_post_engagement.sql` for why post_type
is part of the key. Always include `post_type` explicitly: it defaults to
`'news'`, so a query that omits it will silently add News views to what
you meant as an Analysis post's count (or vice versa).

To bump a single post's count, insert synthetic rows with random visitor
ids - the table doesn't care whether a row came from a real cookie or not:

```sql
-- Add 25 views to an Analysis post
insert into news_post_views (post_type, post_uid, visitor_id)
select 'analysis', 'the-post-slug', gen_random_uuid()::text
from generate_series(1, 25);
```

For setting (or topping up to) an exact target count across several posts
at once - News and Analysis mixed freely - fill in
`supabase/set_view_counts.sql` and run it; it's a reusable template, not a
one-time script.

To reduce a count instead, delete some rows (order doesn't matter, since
individual rows aren't meaningful - only the count is):

```sql
-- Remove 10 views from a post
delete from news_post_views
where id in (
  select id from news_post_views
  where post_type = 'analysis' and post_uid = 'the-post-slug'
  limit 10
);
```

To check the current total for one post:

```sql
select count(*) from news_post_views
where post_type = 'analysis' and post_uid = 'the-post-slug';
```

For seeding every existing post at once (e.g. giving the archive a
realistic-looking baseline before organic traffic arrives), see
`supabase/seed_view_counts.sql` (News) and `supabase/seed_analysis_view_counts.sql`
(Analysis) - one-time scripts, not meant to be run more than once (both are
self-guarding against that, but neither will include a post created after
it was generated). Both key on `post_type` (see
`supabase/migrations/0015_analysis_post_engagement.sql`), so re-running the
News one won't touch Analysis counts or vice versa.
