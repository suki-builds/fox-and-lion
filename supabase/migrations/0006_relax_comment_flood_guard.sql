-- Fixes a real bug from 0004_news_comments.sql: the 10-second flood guard
-- on the insert policy blocked completely normal usage (e.g. posting a
-- comment, then immediately replying to one) - not just actual flooding -
-- surfaced the first time this was tested end to end. The composer already
-- disables its submit button while a request is in flight, which covers
-- accidental double-clicks; a real rate limit, if spam ever becomes an
-- actual problem, deserves its own properly-designed pass rather than
-- reintroducing a shorter version of the same bug here.

drop policy if exists "Users can insert own comment" on news_post_comments;

create policy "Users can insert own comment"
  on news_post_comments for insert
  with check (auth.uid() = user_id);
