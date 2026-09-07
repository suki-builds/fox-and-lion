import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { RETIRED_COMPANY_SLUGS } from './lib/retiredCompanySlugs';

// Request-level logging for the careers job detail route, so Vercel's logs
// can answer what the dashboard can't on the current plan: which company/id
// slugs are actually being requested, and by what.
//
// This lives in middleware rather than in the page on purpose. Reading
// headers() inside a Server Component forces that route out of static/ISR
// rendering - which is exactly the cost problem /careers/[company]/[id] was
// just fixed for, so logging there would have undone the fix to measure it.
// Middleware already runs on every matched request and is already dynamic,
// so it carries no such trade-off.
//
// One JSON line per request, prefixed so the whole set can be pulled out of
// Vercel's log search with a single "CAREERS_HIT" filter. Deliberately does
// not log IP - user agent and referer are what identify a scraper, and an
// IP is personal data we have no current use for. Add it here if a blocking
// rule ends up needing it.
const CAREERS_DETAIL_PATH = /^\/careers\/([^/]+)\/([^/]+?)\/?$/;

// Scrapers send malformed percent-encoding often enough that an undefended
// decodeURIComponent here would throw on their requests specifically - the
// ones we most want in the log.
function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function logCareersRequest(request: NextRequest) {
  const match = CAREERS_DETAIL_PATH.exec(request.nextUrl.pathname);
  if (!match) return;
  console.log(
    `CAREERS_HIT ${JSON.stringify({
      company: safeDecode(match[1]),
      id: safeDecode(match[2]),
      ua: request.headers.get('user-agent') || null,
      referer: request.headers.get('referer') || null,
    })}`
  );
}

// Jobs under a retired company slug are permanently gone, so say so rather
// than 404. A 404 means "not here, ask again some time"; a 410 means "this
// is over, drop it" - and crawlers de-list a 410 materially faster. That
// matters because roughly 2,200 dead /careers/anduril/* URLs are still
// indexed and being walked, and they are the single largest source of
// requests to this site.
//
// Answering here rather than in the page is the point. Middleware
// short-circuits before routing, so these never reach the page function at
// all: no render, no Fluid invocation, no Active CPU. Making the render
// cheap (the ISR work in app/(public)/careers/[company]/[id]/page.js) helps
// repeat hits, but a crawler working through thousands of *distinct* URLs
// never repeats one within a cache window, so caching alone could not get
// this below roughly one invocation per URL crawled.
const RETIRED_CAREERS_PATH = new RegExp(
  `^/careers/(${RETIRED_COMPANY_SLUGS.join('|')})(/|$)`,
  'i'
);

function goneResponse() {
  return new NextResponse(
    '<!doctype html><meta charset="utf-8"><title>Gone</title>'
      + '<p>This listing has been removed. <a href="/careers">All careers</a></p>',
    {
      status: 410,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        // Safe to cache hard: a retired slug never comes back. Anything
        // that respects this stops asking for an hour at a time.
        'cache-control': 'public, max-age=3600',
      },
    }
  );
}

// Refreshes the Supabase session cookie on every matched request. Session
// tokens expire; without this, a signed-in user's cookie would silently go
// stale and requests to Server Components/Actions would see them as
// logged out even though their browser still holds an old cookie.
export async function middleware(request: NextRequest) {
  logCareersRequest(request);

  // Before any Supabase work - a crawler hitting a dead listing should cost
  // one regex test, not a session round-trip.
  if (RETIRED_CAREERS_PATH.test(request.nextUrl.pathname)) {
    return goneResponse();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not add code between createServerClient and getUser() - anything in
  // between can race with a token refresh and log the user out randomly.
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  // Excludes static assets (favicon/_next) and everything under /api/ -
  // none of the existing API routes (submit-pitch, submit-contact,
  // revalidate, search-index) are session-aware, so there's no reason for
  // them to pay for a Supabase auth round-trip on every request.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
