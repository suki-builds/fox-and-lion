// Company slugs that were once served under /careers/<slug>/<id> and no
// longer exist. Anduril and Palantir were removed from COMPANIES in
// lib/ats.js by request; their 2,521 ats_jobs rows were orphaned rather
// than deleted (the sync route's per-company delete only touched slugs
// still in the list) and stayed on the public board until they were
// cleaned up. Crawlers that indexed those pages in the meantime still hold
// roughly 2,200 of those URLs and keep requesting them.
//
// Deliberately a standalone module with no imports: middleware.ts runs in
// the Edge runtime, and pulling this from lib/ats.js would drag the Prismic
// and Supabase clients into the edge bundle for a list of two strings.
//
// Removing a slug from here just means its URLs go back to being ordinary
// 404s, which is safe - this list only ever makes a response *more*
// definitive, never less.
export const RETIRED_COMPANY_SLUGS = ['anduril', 'palantir'];
