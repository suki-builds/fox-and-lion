# Fox and Lion — Next.js site

Phase 1 scaffold: core site with two manually-authored content sections
(Analysis, News) backed by Prismic, plus a live jobs board sourced
directly from company ATS APIs (see `lib/ats.js`). No digest integration,
no auth, no community layer — those come later.

Originally built on DatoCMS; migrated to Prismic (content) + Supabase
(pitch/contact form submissions) after DatoCMS's free-tier asset bandwidth
got exhausted in a single day. See the "Migrating from DatoCMS" section
below if you're the one running that migration.

## What's already built

- Route structure under `app/(public)/` — the `(public)` folder groups
  every current page together so that when the community layer (Phase 2)
  gets added, you add auth-checking middleware to one new `(community)`
  folder instead of touching these pages.
- List and detail pages for Analysis and News, pulling from Prismic.
- A live `/careers` board pulling directly from each company's public ATS
  API (Greenhouse, Lever) — see `lib/ats.js` for the company list and
  the caching/exclusion notes.
- Home, About, and Contact pages (About/Contact are static placeholders —
  edit the files directly, they don't need to live in Prismic since they
  change rarely).
- Placeholder styling in `app/globals.css` — functional, not the final
  visual identity. Treat the heraldic/illustration design work as a
  separate pass once the structure here is confirmed to work.

## What you need to do before this runs

### 1. Install Node.js

If you don't have it: https://nodejs.org (LTS version). Then in this
project folder:

```
npm install
```

### 2. Set up Prismic

Create a free repository at https://prismic.io, then build two page types
with these **exact** API IDs (the code queries by these names — Settings
> Custom Types / page types in the Prismic dashboard):

**Analysis Post** (`analysis_post`)
| Field label | API ID | Type |
|---|---|---|
| Title | `title` | Text |
| Excerpt | `excerpt` | Rich Text (bullet lists allowed) |
| Author | `author` | Text |
| Category | `category` | Text |
| Cover Image | `cover_image` | Image |
| Body | `body` | Rich Text — enable Image + Embed as allowed block types, in addition to the defaults |
| Published At (override) | `published_at` | Timestamp — optional, see note below |
| SEO Title | `seo_title` | Text |
| SEO Description | `seo_description` | Text |
| SEO Twitter Card | `seo_twitter_card` | Select (`summary`, `summary_large_image`) |
| SEO No Index | `seo_no_index` | Boolean |
| SEO Image | `seo_image` | Image |

The UID field is added automatically by Prismic's page type builder —
that's what the `slug` in every `/analysis/<slug>` URL comes from.

**News Post** (`news_post`)
| Field label | API ID | Type |
|---|---|---|
| Title | `title` | Text |
| Source URL | `source_url` | Text |
| Commentary | `commentary` | Rich Text (plain text formatting only — no embedded blocks are used for News) |
| Published At (override) | `published_at` | Timestamp — optional, see note below |
| SEO Description | `seo_description` | Text |
| SEO Twitter Card | `seo_twitter_card` | Select |
| SEO No Index | `seo_no_index` | Boolean |
| SEO Image | `seo_image` | Image |

**About `published_at`:** it's an optional manual override. Leave it blank
and the site falls back to Prismic's own automatic `first_publication_date`
system timestamp — set it only when you need to backdate an entry (e.g.
News commentary written the day after the source article actually broke)
or force tie-breaking order between same-day posts. See
`lib/publishedDate.js`.

If you name fields differently than the tables above, update
`lib/prismic.js` (`getAllByType`/`getByUID` calls) and the field access in
the page components under `app/(public)/analysis/` and
`app/(public)/news/` to match.

Once the page types exist, go to **Settings > API & Security** and:
- If the repository is public (default), you don't need a token.
- If you set it to private, generate a read-only **Access Token** and put
  it in `PRISMIC_ACCESS_TOKEN`.

### 3. Set up Supabase

Pitch and contact form submissions are stored in Supabase (not Prismic —
Prismic doesn't support arbitrary public writes from a live site the way a
database does). In your Supabase project's SQL editor, run:

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

alter table pitch_submissions enable row level security;
alter table contact_messages enable row level security;

create policy "anon insert only" on pitch_submissions
  for insert to anon with check (true);
create policy "anon insert only" on contact_messages
  for insert to anon with check (true);
```

No select/update/delete policy is created for `anon`, so the public site
can only insert — read the submissions from the Supabase table editor
(authenticated as yourself), not through the public API.

### 4. Set environment variables

```
cp .env.local.example .env.local
```

Fill in `NEXT_PUBLIC_PRISMIC_REPOSITORY_NAME` (your repo's subdomain),
`PRISMIC_ACCESS_TOKEN` (only if the repo is private), and the Supabase
project URL/anon key.

### 5. Run it locally

```
npm run dev
```

Visit http://localhost:3000. It will look sparse until you've added at
least one entry to each Prismic page type.

### 6. Deploy to Vercel

- Push this project to a GitHub repo.
- In Vercel, "Add New Project" → import that repo.
- Add the same environment variables from `.env.local` into Vercel's
  project settings (Settings > Environment Variables).
- Deploy. Vercel gives you a `*.vercel.app` preview URL immediately.

### 7. Set up on-demand revalidation (Prismic webhooks)

The homepage, `/analysis`, and `/news` are cached for an hour (`revalidate:
3600`), so by default a newly published article won't appear until that
hour is up. `/api/revalidate` (see `app/api/revalidate/route.js`) lets
Prismic push an instant refresh instead, the moment you publish.

First, generate a secret and set it in both `.env.local` (for local
testing) and Vercel's project environment variables:

```
openssl rand -hex 32
```

Paste the result into `REVALIDATE_SECRET` in both places.

Then, in Prismic, go to **Settings > Webhooks** and create **one**
webhook (Prismic can't scope a webhook to a specific page type the way
DatoCMS could, and it delivers its secret as a `secret` field in the JSON
body rather than a custom header — `/api/revalidate` is written for that,
not DatoCMS's header-based mechanism):

- URL: `https://<your-domain>/api/revalidate`
- Secret: the `REVALIDATE_SECRET` value above (Prismic includes whatever
  you put here as `body.secret` on every request)
- Triggers: at minimum, document publish and unpublish

Every trigger revalidates both Analysis and News (plus the homepage and
search index) regardless of which one actually changed — harmless, just
slightly broader than DatoCMS's old per-type setup.

Use your Vercel `*.vercel.app` URL until you've confirmed everything
works, then switch the webhook URL to `https://foxandlion.pub`.

To confirm it's working: publish or edit an entry in Prismic, then check
Settings > Webhooks > (the webhook) > delivery log for a `200` response
with a body like `{"revalidated":true,"paths":[...]}`, and confirm the
change shows up on the live site immediately rather than after an hour.

## Migrating from DatoCMS

If Analysis/News content already exists in DatoCMS (this project's
original CMS), run the one-off `scripts/migrate-dato-to-prismic.mjs`
script once Prismic's page types (above) exist:

```
DATOCMS_API_TOKEN=... PRISMIC_WRITE_TOKEN=... NEXT_PUBLIC_PRISMIC_REPOSITORY_NAME=... node scripts/migrate-dato-to-prismic.mjs
```

- `DATOCMS_API_TOKEN` — DatoCMS's old read-only token (Settings > API
  tokens), only needed for this one run.
- `PRISMIC_WRITE_TOKEN` — a write-scoped token from Prismic Settings >
  API & Security, used only locally for this script, never deployed.

It reads every Analysis and News entry from DatoCMS, converts the
Structured Text body/commentary and Markdown excerpt to Prismic's Rich
Text format, uploads cover/body images into Prismic's media library, and
creates the equivalent Prismic documents as **drafts** — you still need to
review and publish them in Prismic afterward. It explicitly sets each
document's `published_at` override from the original DatoCMS publish date,
so the back-catalogue's chronological order is preserved (Prismic's own
`first_publication_date` would otherwise reflect the migration date, not
the article's real one).

Once you've confirmed the migrated content and the rest of this README's
setup works end-to-end, remove the `DATOCMS_*` environment variables from
Vercel and this is done with DatoCMS entirely.

## What's deliberately not in this scaffold

- **No digest / GitHub Actions integration.** Removed from scope —
  AdSense flagged the auto-aggregated format. All three content types
  here are manually authored.
- **No auth / community layer.** That's Phase 2. The `(public)` route
  group exists specifically so that work doesn't require restructuring
  these pages.
- **No finished visual identity.** `globals.css` has working but plain
  placeholder styles. The heraldic/military illustration direction needs
  its own design pass with real assets (logo, illustration set, type
  choices).
