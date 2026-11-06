# Fox and Lion

The site behind [foxandlion.pub](https://foxandlion.pub), a defence-tech
publication with original analysis, news and a jobs board.

The [roadmap](ROADMAP.md) lists what's planned next.

## Stack

- **Next.js 14** (App Router), hosted on Vercel
- **Prismic** for analysis, news and manually posted jobs
- **Supabase** for sign-in (Google), votes, comments, view counts, pitch and
  contact submissions, job applications and the newsletter list
- Live jobs pulled each morning from company Greenhouse and Lever boards
  (`lib/ats.js`, synced by a Vercel cron at 06:00)

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill it in
npm run dev
```

The site runs at http://localhost:3000.

### Environment variables

| Variable | What it's for |
|---|---|
| `NEXT_PUBLIC_PRISMIC_REPOSITORY_NAME` | Prismic repo subdomain |
| `PRISMIC_ACCESS_TOKEN` | Only if the Prismic repo is private |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side admin client (`lib/supabase/admin.ts`). Never expose it to the browser. |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL |
| `REVALIDATE_SECRET` | Shared with the Prismic webhook |
| `CRON_SECRET` | Lets Vercel Cron call `/api/sync-jobs` |

Set the same values in Vercel under Settings > Environment Variables.

## Where things live

```
app/(public)/     every page on the site
app/api/          forms, newsletter, search index, jobs sync, revalidation
components/       UI components
lib/              Prismic, Supabase, ATS feeds, formatting helpers
customtypes/      Prismic page type definitions
supabase/         SQL migrations, numbered in the order they were run
scripts/          one-off scripts (thumbnail backfill, the old DatoCMS import)
```

Styles are in `app/globals.css`. Fonts are Libre Caslon Text for headlines,
Schibsted Grotesk for labels and Source Sans 3 for body text, all loaded
through `next/font/google`.

## Publishing

Pages are cached for an hour. When something is published or unpublished in
Prismic, a webhook calls `/api/revalidate`, which refreshes the homepage,
the analysis and news lists and the search index straight away.

Webhook setup, in Prismic under Settings > Webhooks:

- URL: `https://foxandlion.pub/api/revalidate`
- Secret: the value of `REVALIDATE_SECRET`
- Triggers: document published and unpublished

To check it's working, open the webhook's delivery log in Prismic. A good
delivery returns `200` with `{"revalidated":true, ...}`.

Each post has an optional `published_at` field. Leave it blank to use
Prismic's own publish date, or set it to backdate a post or fix the order of
same-day posts (`lib/publishedDate.js`).

## Prismic page types

The code reads fields by these exact API IDs. Full definitions are in
`customtypes/`.

<details>
<summary><strong>Analysis Post</strong> (<code>analysis_post</code>)</summary>

| Field | API ID | Type |
|---|---|---|
| Title | `title` | Text |
| Excerpt | `excerpt` | Rich Text (bullet lists allowed) |
| Author | `author` | Text |
| Category | `category` | Text |
| Cover Image | `cover_image` | Image |
| Body | `body` | Rich Text, with Image and Embed blocks enabled |
| Published At | `published_at` | Timestamp, optional |
| SEO Title / Description | `seo_title`, `seo_description` | Text |
| SEO Twitter Card | `seo_twitter_card` | Select (`summary`, `summary_large_image`) |
| SEO No Index | `seo_no_index` | Boolean |
| SEO Image | `seo_image` | Image |

</details>

<details>
<summary><strong>News Post</strong> (<code>news_post</code>)</summary>

| Field | API ID | Type |
|---|---|---|
| Title | `title` | Text |
| Source URL | `source_url` | Text |
| Commentary | `commentary` | Rich Text |
| Published At | `published_at` | Timestamp, optional |
| SEO Description | `seo_description` | Text |
| SEO Twitter Card | `seo_twitter_card` | Select |
| SEO No Index | `seo_no_index` | Boolean |
| SEO Image | `seo_image` | Image |

</details>

<details>
<summary><strong>Careers Post</strong> (<code>careers_post</code>)</summary>

For roles that aren't on a Greenhouse or Lever board. They appear on
`/careers` alongside the live feed and use the same filters, so the Select
options must match exactly, including case and the `&`.

| Field | API ID | Type |
|---|---|---|
| Title | `title` | Text |
| Company Name | `company_name` | Text |
| Location | `location` | Text, e.g. "London, United Kingdom" or "Remote" |
| Workplace Type | `workplace_type` | Select: `Remote`, `Hybrid`, `Onsite` |
| Role Type | `role_type` | Select: `Engineering`, `Research`, `Product`, `Design`, `Program & Operations`, `People & Talent`, `Sales & Business Development`, `Finance & Accounting`, `Legal & Policy`, `Administrative`, `Other` |
| Employment Type | `employment_type` | Select: `Full-time`, `Part-time`, `Contract`, `Internship` |
| Department | `department` | Text, optional |
| Apply URL | `apply_url` | Link |
| Description | `description` | Rich Text. `heading5` renders as a divider and `heading6` as a caption. |
| Posted At | `posted_at` | Timestamp, optional |
| Featured | `featured` | Boolean. Pins the job to the top of `/careers`. |

</details>

## Supabase

The community features (votes, comments, views, moderation, profiles, the
newsletter list and so on) are built from the migrations in
`supabase/migrations/`, run in number order in the Supabase SQL editor.

The form tables predate the migrations folder, so their SQL is here. The
public site can insert into them but never read them. Read submissions in
the Supabase table editor.

<details>
<summary>Form tables and storage buckets</summary>

```sql
create table pitch_submissions (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  bio text not null,
  pitch text not null,
  review_status text not null default 'Received',
  created_at timestamptz not null default now()
);

create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  organisation text not null,
  message text not null,
  replied boolean not null default false,
  created_at timestamptz not null default now()
);

-- Applications for manually posted jobs. Greenhouse and Lever roles apply
-- on their own boards. resume_path is a path in the "resumes" bucket.
create table job_applications (
  id uuid primary key default gen_random_uuid(),
  careers_post_uid text not null,
  job_title text not null,
  company_name text not null,
  first_name text not null,
  last_name text not null,
  email text not null,
  linkedin_url text,
  resume_path text not null,
  attachment_paths text[] not null default '{}',
  cover_note text,
  reviewed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table pitch_submissions enable row level security;
alter table contact_messages enable row level security;
alter table job_applications enable row level security;

create policy "anon insert only" on pitch_submissions
  for insert to anon with check (true);
create policy "anon insert only" on contact_messages
  for insert to anon with check (true);
create policy "anon insert only" on job_applications
  for insert to anon with check (true);

-- Private buckets for CVs and up to five extra files per application
-- (20MB combined). Anyone can upload; only the dashboard can read.
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false),
       ('application-attachments', 'application-attachments', false);

create policy "anon insert only - resumes"
  on storage.objects for insert to anon
  with check (bucket_id = 'resumes');

create policy "anon insert only - application-attachments"
  on storage.objects for insert to anon
  with check (bucket_id = 'application-attachments');
```

To open an applicant's files, copy the paths from their
`job_applications` row and find them under Storage > `resumes` or
Storage > `application-attachments`.

</details>

## Good to know

- **Archived posts close to new votes and comments.** That happens after 7
  days for news and 30 for analysis (`lib/publishedDate.js`). Existing
  votes and comments stay visible. The rule is enforced in the site only,
  not by the database, because Supabase doesn't know a post's publish date.
  Someone calling the API by hand could still vote on an old post. If that
  ever matters, mirror publish dates into Supabase from the revalidate
  webhook and check them there.
- **Job pages.** Only the featured job and the newest 100 are built at
  deploy time. The rest are generated on first visit, which keeps builds
  short.
- **Links don't prefetch.** Every `<Link>` has `prefetch={false}`. By
  default Next.js preloads each link as it scrolls into view, and every
  preload is a CDN request, which ran close to the Hobby plan's limit.
  Keep it off on new links.
- **Vercel plan.** The Hobby plan is non-commercial only. Move to Pro before
  selling anything on the site.
