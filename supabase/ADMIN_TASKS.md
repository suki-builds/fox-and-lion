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

## Manually adjust a News post's view count

View counts come from `count(*)` over `news_post_views` rows for that
`post_uid` (one row per unique visitor). To bump a post's count, insert
synthetic rows with random visitor ids - the table doesn't care whether a
row came from a real cookie or not:

```sql
-- Add 25 views to a post
insert into news_post_views (post_uid, visitor_id)
select 'the-post-slug', gen_random_uuid()::text
from generate_series(1, 25);
```

To reduce a count instead, delete some rows (order doesn't matter, since
individual rows aren't meaningful - only the count is):

```sql
-- Remove 10 views from a post
delete from news_post_views
where id in (
  select id from news_post_views
  where post_uid = 'the-post-slug'
  limit 10
);
```

To set an exact count, check the current total first:

```sql
select count(*) from news_post_views where post_uid = 'the-post-slug';
```

then add or remove the difference using the recipes above.
