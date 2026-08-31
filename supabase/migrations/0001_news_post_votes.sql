-- Upvote/downvote for News posts. Run this in the Supabase SQL Editor -
-- there's no CLI/migration runner wired up for this project, this file is
-- just the source of truth for what's been applied.

create table if not exists news_post_votes (
  id uuid primary key default gen_random_uuid(),
  post_uid text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (post_uid, user_id)
);

alter table news_post_votes enable row level security;

-- Each signed-in user can only ever see/write their own vote row - nobody
-- can see how anyone else voted. Public aggregate totals are exposed
-- separately below, via a function that doesn't leak individual votes.
create policy "Users can view own vote"
  on news_post_votes for select
  using (auth.uid() = user_id);

create policy "Users can insert own vote"
  on news_post_votes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own vote"
  on news_post_votes for update
  using (auth.uid() = user_id);

create policy "Users can delete own vote"
  on news_post_votes for delete
  using (auth.uid() = user_id);

-- security definer so it can read across all rows to compute the totals,
-- while the table's own RLS keeps individual votes/user_ids private.
-- Returns one row per requested post_uid that has at least one vote;
-- posts with zero votes simply won't appear (the client treats a missing
-- row as a score of 0).
create or replace function get_news_post_vote_totals(uids text[])
returns table (post_uid text, upvotes bigint, downvotes bigint, score bigint)
language sql
security definer
set search_path = public
as $$
  select
    post_uid,
    count(*) filter (where value = 1) as upvotes,
    count(*) filter (where value = -1) as downvotes,
    coalesce(sum(value), 0) as score
  from news_post_votes
  where post_uid = any(uids)
  group by post_uid;
$$;

grant execute on function get_news_post_vote_totals(text[]) to anon, authenticated;
