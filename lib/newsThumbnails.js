import { createAdminClient } from './supabase/admin';
import { createPublicClient } from './supabase/public';
import { scrapePageMeta } from './ogImage';

// The most live scrapes a single call will start. A post with no stored row
// gets scraped on the spot as a self-healing fallback, but that must never
// fan out to the whole list: on 2026-09-13 a /news regeneration got nothing
// back from the thumbnails read, treated all ~439 posts as missing, fired
// ~439 concurrent scrapes from one function, and every one of them failed.
// Anything past this cap simply renders without a thumbnail this time and
// is picked up by a later render (or by the publish webhook).
const MAX_LIVE_SCRAPES_PER_CALL = 5;

const READ_ATTEMPTS = 3;

// Reads stored thumbnails, retrying transient failures. Throws the last error
// if every attempt fails - see getBatchedThumbnails for why that's the
// right outcome rather than returning nothing.
//
// An RPC call, not `.from(...).select().in('post_uid', uids)` - .in()
// encodes its array into the request URL, which blows past PostgREST's
// header/URL size limit once the News list has a few hundred posts (see
// supabase/migrations/0019_batched_thumbnails_rpc.sql). An RPC sends its
// arguments in the POST body instead, so list length no longer matters -
// same reason getBatchedPostStats() already calls an RPC for this.
async function readStoredThumbnails(uids) {
  const supabase = createPublicClient();
  let lastError;
  for (let attempt = 1; attempt <= READ_ATTEMPTS; attempt += 1) {
    const { data, error } = await supabase.rpc('get_news_post_thumbnails', { uids });
    if (!error) return data || [];
    lastError = error;
    if (attempt < READ_ATTEMPTS) await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
  }
  throw lastError;
}

// Persists a News post's scraped thumbnail instead of re-scraping its
// source article on every page view - see
// supabase/migrations/0018_news_post_thumbnails.sql. Called from the
// Prismic publish webhook (app/api/revalidate/route.js) and, as a
// self-healing fallback for any post that doesn't have a row yet, from
// getBatchedThumbnails below. Uses the service-role client since this
// only ever runs server-side (webhook handler, Server Component render
// paths), never in response to arbitrary client input.
//
// A scrape result can only ever ADD information, never remove it.
// scrapePageMeta never throws - a timeout, a 404, a network error and a
// page that genuinely has no og:image all come back as the same nulls - so
// a null here means "we don't know", not "there is no image". This used to
// upsert the nulls unconditionally, which is how one failed batch replaced
// every stored image and source name on the site with null. Now:
//   - fields the scrape did find are written (a changed og:image still
//     updates, as it should)
//   - fields it didn't find are left out of the write, so whatever is
//     already stored survives
//   - if it found nothing at all, a row is created only when none exists,
//     recording the attempt so the post isn't re-scraped on every render
// supabase/migrations/0021_protect_thumbnail_values.sql enforces the same
// rule in the database, so it holds for any other writer too.
export async function storeThumbnail(postUid, sourceUrl) {
  const meta = await scrapePageMeta(sourceUrl);
  const admin = createAdminClient();
  const scrapedAt = new Date().toISOString();

  if (!meta.image && !meta.siteName) {
    const { error } = await admin
      .from('news_post_thumbnails')
      .upsert({ post_uid: postUid, scraped_at: scrapedAt }, { onConflict: 'post_uid', ignoreDuplicates: true });
    if (error) throw new Error(`Failed to record thumbnail attempt for ${postUid}: ${error.message}`);
    return meta;
  }

  const row = { post_uid: postUid, scraped_at: scrapedAt };
  if (meta.image) row.image_url = meta.image;
  if (meta.siteName) row.site_name = meta.siteName;
  const { error } = await admin.from('news_post_thumbnails').upsert(row, { onConflict: 'post_uid' });
  if (error) throw new Error(`Failed to store thumbnail for ${postUid}: ${error.message}`);
  return meta;
}

// Batched read for a page's worth of posts - one query regardless of list
// length, instead of a live scrape per post. `uidToSourceUrl` is a
// { [postUid]: sourceUrl } map. A post with no stored row yet (published
// before this table existed, or whose webhook-triggered scrape hasn't
// landed) falls back to a live, one-off scrape that's then stored for
// next time - capped at MAX_LIVE_SCRAPES_PER_CALL per call.
export async function getBatchedThumbnails(uidToSourceUrl) {
  const uids = Object.keys(uidToSourceUrl);
  if (uids.length === 0) return {};

  // A failed read means "we don't know what's stored", not "nothing is
  // stored". This error used to be discarded, so a failed read looked like
  // an empty table, every post counted as missing, and the fallback below
  // scraped - and then overwrote - the lot (2026-09-13).
  //
  // The first fix for that returned {} and rendered without thumbnails. That
  // protected the data but not the page: a failed read during a regeneration
  // got cached, so one Supabase blip blanked /news or the homepage for
  // everyone until the next regeneration, up to an hour later. That happened
  // on 2026-09-14 during a Supabase API gateway degradation ("Failed to get
  // project config", "Gateway Timeout").
  //
  // So now: retry, since those gateway errors are usually gone within a
  // second. If it still fails at runtime, throw. When a background
  // regeneration throws, Next keeps serving the last successfully generated
  // page and retries on the next request, so visitors keep seeing the
  // thumbnails that were there. The exception is `next build`: throwing there
  // would fail the whole deploy on a Supabase blip, so a build renders
  // without thumbnails instead, and the page corrects itself at its first
  // regeneration.
  let rows;
  try {
    rows = await readStoredThumbnails(uids);
  } catch (error) {
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      console.error('get_news_post_thumbnails failed during build; rendering without thumbnails:', error.message);
      return {};
    }
    throw new Error(`get_news_post_thumbnails failed after ${READ_ATTEMPTS} attempts: ${error.message}`);
  }

  const result = {};
  (rows || []).forEach((row) => {
    result[row.post_uid] = { image: row.image_url, siteName: row.site_name };
  });

  const missing = uids.filter((uid) => !(uid in result) && uidToSourceUrl[uid]);
  const toScrape = missing.slice(0, MAX_LIVE_SCRAPES_PER_CALL);
  if (toScrape.length > 0) {
    const fetched = await Promise.all(
      toScrape.map((uid) =>
        storeThumbnail(uid, uidToSourceUrl[uid]).catch(() => ({ image: null, siteName: null }))
      )
    );
    toScrape.forEach((uid, index) => {
      result[uid] = fetched[index];
    });
  }

  return result;
}

// Convenience wrapper for a single post (detail pages) - same self-healing
// behavior as getBatchedThumbnails, just without the caller needing to
// build a one-entry map.
export async function getThumbnail(postUid, sourceUrl) {
  if (!sourceUrl) return { image: null, siteName: null };
  const result = await getBatchedThumbnails({ [postUid]: sourceUrl });
  return result[postUid] || { image: null, siteName: null };
}
