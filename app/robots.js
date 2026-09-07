// Until this existed, foxandlion.pub/robots.txt 404'd - nothing told a
// crawler what was and wasn't worth fetching.
//
// Note what is NOT disallowed here: /careers/anduril/ and
// /careers/palantir/, the retired slugs that generate nearly all of this
// site's crawler load. Blocking them in robots.txt would stop the requests
// but also stop crawlers ever seeing the 410 Gone that middleware.ts now
// returns for them - and a URL blocked before it can be fetched stays in
// the index rather than being dropped from it. The 410 is what actually
// gets them de-listed, and it already costs nothing (middleware answers it
// without ever invoking the page function). Once they've aged out of the
// major indexes, adding
//     { userAgent: '*', disallow: ['/careers/anduril/', '/careers/palantir/'] }
// stops even those edge requests. Doing it now would trade a permanent
// index entry for a marginal saving.
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Private or functional routes with nothing to index. /account and
        // /moderation are signed-in only, /auth/ is the OAuth callback, and
        // /api/ is machine endpoints - a crawler fetching any of these
        // costs a request and gains nothing.
        disallow: ['/account', '/moderation', '/auth/', '/api/', '/sign-in'],
      },
    ],
  };
}
