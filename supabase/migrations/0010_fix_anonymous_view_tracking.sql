-- Fixes anonymous view tracking, which has never actually worked - every
-- insert into news_post_views was rejected with a generic RLS-violation
-- error. news_post_views is the only table in this schema that a
-- signed-out (anon) visitor writes to directly; every other insert (votes,
-- comments, reports) requires auth.uid(), so this specific gap was never
-- exercised until now.
--
-- Belt-and-braces fix: an explicit table grant, plus recreating the policy
-- with an explicit role list. A generic RLS-violation error doesn't
-- distinguish "no policy matched" from "no table-level grant" - Postgres
-- requires both a GRANT and a passing policy, and either one being missing
-- produces the exact same-looking error, so this covers both possibilities
-- rather than guessing which one it was.

grant select, insert on news_post_views to anon, authenticated;

drop policy if exists "Anyone can record a view" on news_post_views;

create policy "Anyone can record a view"
  on news_post_views for insert
  to anon, authenticated
  with check (visitor_id is not null and length(visitor_id) > 0);

-- Still no select policy - granting the privilege above doesn't expose
-- individual rows, since RLS has no policy permitting a SELECT and
-- defaults to denying it. Aggregates are still only readable via the
-- security-definer get_news_post_stats().
