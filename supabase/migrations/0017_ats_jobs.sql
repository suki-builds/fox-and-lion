-- Backs the careers feed's ATS-sourced jobs with a Supabase table instead
-- of live-fetching every company's bulk API inside the page-request path.
-- A cron-triggered sync route (app/api/sync-jobs/route.js) populates this
-- on a schedule; getAllJobs()/getJobDetail() in lib/ats.js just read from
-- it. Manual job postings (Prismic careers_post) are unaffected - they're
-- still merged in live at read time, same as before this migration.
--
-- Run after 0016_post_shares.sql, in the Supabase SQL Editor - same as
-- every other file in this folder.

create table if not exists ats_jobs (
  id text primary key,
  company text not null,
  company_slug text not null,
  company_domain text,
  platform text not null,
  platform_id text not null,
  title text not null,
  location text,
  locations jsonb,
  workplace_type text,
  department text,
  role_type text,
  employment_type text,
  apply_url text,
  description_html text,
  posted_at timestamptz,
  synced_at timestamptz not null default now()
);

create index if not exists ats_jobs_company_slug_idx on ats_jobs (company_slug);

alter table ats_jobs enable row level security;

-- Public read only, same as every other public listing on the site.
-- Writes only ever come from the sync route, which uses the service role
-- key (bypasses RLS entirely) - so there's deliberately no insert/update/
-- delete policy for anon here at all.
create policy "Anyone can read job listings"
  on ats_jobs for select
  using (true);
