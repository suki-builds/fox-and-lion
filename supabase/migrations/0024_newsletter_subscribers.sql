-- Newsletter sign-ups from the homepage form (components/NewsletterSignup.js,
-- via app/api/newsletter-signup). Same shape of access as contact_messages:
-- the public site can only insert, and the list is read from the Supabase
-- table editor or exported from there into whichever mail tool sends it.
--
-- Emails are stored lowercased by the API route, and the unique index makes
-- a repeat sign-up a no-op rather than a duplicate row. The route treats
-- that unique violation as success, so the form never reveals whether an
-- address was already on the list.

create table newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz not null default now()
);

create unique index newsletter_subscribers_email_key
  on newsletter_subscribers (lower(email));

alter table newsletter_subscribers enable row level security;

create policy "anon insert only" on newsletter_subscribers
  for insert to anon with check (true);
