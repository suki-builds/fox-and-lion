import { unstable_cache } from 'next/cache';

const OG_IMAGE_PATTERN =
  /<meta[^>]+(?:property|name)=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i;
const OG_IMAGE_PATTERN_REVERSED =
  /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image(?::secure_url)?["']/i;

async function fetchOgImageUncached(articleUrl) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(articleUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FoxAndLionBot/1.0)' },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;

    // og:image is always in <head>, so we don't need the whole document —
    // reading a capped prefix avoids downloading multi-MB article pages.
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

    const match = html.match(OG_IMAGE_PATTERN) || html.match(OG_IMAGE_PATTERN_REVERSED);
    if (!match) return null;

    return new URL(match[1], articleUrl).toString();
  } catch {
    // Network error, timeout, malformed URL, etc — thumbnails are a nice-to-have,
    // never worth failing the page over.
    return null;
  }
}

// Cached per-URL for a day — og:image rarely changes, and this avoids
// re-fetching outlets' article pages on every site visit.
export const getOgImage = unstable_cache(fetchOgImageUncached, ['fox-and-lion-og-image'], {
  revalidate: 86400,
});
