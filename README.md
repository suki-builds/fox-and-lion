# Fox and Lion — Next.js site

Phase 1 scaffold: core site with two manually-authored content sections
(Analysis, News) backed by DatoCMS, plus a live jobs board sourced
directly from company ATS APIs (see `lib/ats.js`). No digest integration,
no auth, no community layer — those come later.

## What's already built

- Route structure under `app/(public)/` — the `(public)` folder groups
  every current page together so that when the community layer (Phase 2)
  gets added, you add auth-checking middleware to one new `(community)`
  folder instead of touching these pages.
- List and detail pages for Analysis and News, pulling from DatoCMS via
  GraphQL.
- A live `/jobs` board pulling directly from each company's public ATS
  API (Greenhouse, Lever) — see `lib/ats.js` for the company list and
  the caching/exclusion notes.
- Home, About, and Contact pages (About/Contact are static placeholders —
  edit the files directly, they don't need to live in DatoCMS since they
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

### 2. Set up DatoCMS

Create a free account at https://www.datocms.com, create a new empty
project, then build three content models with these **exact** field API
names (the code queries by these names):

**Analysis Post** (model API name: `analysis_post`)
| Field label | Field API name | Type |
|---|---|---|
| Title | `title` | Single line string |
| Slug | `slug` | Slug (linked to Title) |
| Excerpt | `excerpt` | Single line string |
| Author | `author` | Single line string |
| Cover Image | `cover_image` | Single asset |
| Body | `body` | Structured text |
| Published Date | `published_date` | Date |

**News Post** (model API name: `news_post`)
| Field label | Field API name | Type |
|---|---|---|
| Title | `title` | Single line string |
| Slug | `slug` | Slug (linked to Title) |
| Source URL | `source_url` | Single line string |
| Commentary | `commentary` | Structured text |
| Published Date | `published_date` | Date |

DatoCMS auto-generates GraphQL field names from these — camelCase versions
of what's above (e.g. `publishedDate`, `coverImage`, `sourceUrl`). If you
name fields differently than this table, you'll need to update
`lib/queries.js` to match.

Once the models exist, go to Settings > API tokens and copy the read-only
token.

### 3. Set environment variables

```
cp .env.local.example .env.local
```

Paste your DatoCMS token into `DATOCMS_API_TOKEN` in `.env.local`.

### 4. Run it locally

```
npm run dev
```

Visit http://localhost:3000. It will look sparse until you've added at
least one entry to each DatoCMS model.

### 5. Migrate your existing content

Manually copy each existing Analysis article and News item from Wix into
the matching DatoCMS model. There's no shortcut for this — budget real
time for it, especially for Analysis if there's a large back-catalogue.

### 6. Deploy to Vercel

- Push this project to a GitHub repo.
- In Vercel, "Add New Project" → import that repo.
- Add the same environment variables from `.env.local` into Vercel's
  project settings (Settings > Environment Variables).
- Deploy. Vercel gives you a `*.vercel.app` preview URL immediately.

### 7. Domain cutover (do this last, once everything is tested)

- In Vercel, add `foxandlion.pub` as a custom domain.
- Update the domain's DNS records (wherever it's registered) to point at
  Vercel, following the exact records Vercel shows you.
- Keep the Wix site untouched until DNS has propagated and you've
  confirmed the new site works, including checking that old URLs people
  may have bookmarked or linked to still resolve somewhere sensible.

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
