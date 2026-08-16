import { unstable_cache } from 'next/cache';

const OG_IMAGE_PATTERN =
  /<meta[^>]+(?:property|name)=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i;
const OG_IMAGE_PATTERN_REVERSED =
  /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image(?::secure_url)?["']/i;
const OG_SITE_NAME_PATTERN =
  /<meta[^>]+(?:property|name)=["']og:site_name["'][^>]+content=["']([^"']+)["']/i;
const OG_SITE_NAME_PATTERN_REVERSED =
  /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:site_name["']/i;

function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

async function fetchPageMetaUncached(articleUrl) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(articleUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FoxAndLionBot/1.0)' },
    });
    clearTimeout(timeout);
    if (!res.ok) return { image: null, siteName: null };

    // og:image and og:site_name are always in <head>, so we don't need the
    // whole document — reading a capped prefix avoids downloading multi-MB
    // article pages just to read two meta tags.
    const reader = res.body?.getReader();
    let html = '';
    if (reader) {
      const decoder = new TextDecoder();
      while (html.length < 100000) {
        const { done, value } = await reader.read();
        if (done) break;
        html += decoder.decode(value, { stream: true });
      }
      reader.cancel();
    } else {
      html = await res.text();
    }

    const imageMatch = html.match(OG_IMAGE_PATTERN) || html.match(OG_IMAGE_PATTERN_REVERSED);
    const siteNameMatch =
      html.match(OG_SITE_NAME_PATTERN) || html.match(OG_SITE_NAME_PATTERN_REVERSED);

    return {
      // og:image URLs routinely carry query strings (auth tokens, resize
      // params), so the ampersands are HTML-escaped as &amp; in the markup
      // like any other attribute value — decode before using it as a URL or
      // the token gets mangled (e.g. "?width=1200&amp;auth=xyz" is read as
      // one param named "amp;auth", which 404s/403s on the source's CDN).
      image: imageMatch
        ? new URL(decodeHtmlEntities(imageMatch[1]), articleUrl).toString()
        : null,
      siteName: siteNameMatch ? decodeHtmlEntities(siteNameMatch[1]).trim() : null,
    };
  } catch {
    // Network error, timeout, malformed URL, etc — this metadata is a
    // nice-to-have, never worth failing the page over.
    return { image: null, siteName: null };
  }
}

// Cached per-URL for a day — this metadata rarely changes, and this avoids
// re-fetching outlets' article pages on every site visit. Returns the
// outlet's real og:site_name (e.g. "The Record") alongside the article's
// og:image, since both live in the same <head> fetch.
export const getPageMeta = unstable_cache(fetchPageMetaUncached, ['fox-and-lion-page-meta'], {
  revalidate: 86400,
});
