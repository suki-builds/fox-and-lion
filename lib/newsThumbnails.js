import { createAdminClient } from './supabase/admin';
import { createPublicClient } from './supabase/public';
import { scrapePageMeta } from './ogImage';

// Persists a News post's scraped thumbnail instead of re-scraping its
// source article on every page view - see
// supabase/migrations/0018_news_post_thumbnails.sql. Called from the
// Prismic publish webhook (app/api/revalidate/route.js) and, as a
// self-healing fallback for any post that doesn't have a row yet, from
// getBatchedThumbnails below. Uses the service-role client since this
// only ever runs server-side (webhook handler, Server Component render
// paths), never in response to arbitrary client input.
export async function storeThumbnail(postUid, sourceUrl) {
  const meta = await scrapePageMeta(sourceUrl);
  const admin = createAdminClient();
  const { error } = await admin
    .from('news_post_thumbnails')
    .upsert(
      { post_uid: postUid, image_url: meta.image, site_name: meta.siteName, scraped_at: new Date().toISOString() },
      { onConflict: 'post_uid' }
    );
  if (error) throw new Error(`Failed to store thumbnail for ${postUid}: ${error.message}`);
  return meta;
}

// Batched read for a page's worth of posts - one query regardless of list
// length, instead of a live scrape per post. `uidToSourceUrl` is a
// { [postUid]: sourceUrl } map. A post with no stored row yet (published
// before this table existed, or whose webhook-triggered scrape hasn't
// landed) falls back to a live, one-off scrape that's then stored for
// next time - normally zero or a handful of posts on any given call, not
// the whole list, so this stays bounded even against a cold table.
export async function getBatchedThumbnails(uidToSourceUrl) {
  const uids = Object.keys(uidToSourceUrl);
  if (uids.length === 0) return {};

  // An RPC call, not `.from(...).select().in('post_uid', uids)` - .in()
  // encodes its array into the request URL, which blows past PostgREST's
  // header/URL size limit once the News list has a few hundred posts (see
  // supabase/migrations/0019_batched_thumbnails_rpc.sql). An RPC sends its
  // arguments in the POST body instead, so list length no longer matters -
  // same reason getBatchedPostStats() already calls an RPC for this.
  const supabase = createPublicClient();
  const { data: rows } = await supabase.rpc('get_news_post_thumbnails', { uids });

  const result = {};
  (rows || []).forEach((row) => {
    result[row.post_uid] = { image: row.image_url, siteName: row.site_name };
  });

  const missing = uids.filter((uid) => !(uid in result) && uidToSourceUrl[uid]);
  if (missing.length > 0) {
    const fetched = await Promise.all(
      missing.map((uid) =>
        storeThumbnail(uid, uidToSourceUrl[uid]).catch(() => ({ image: null, siteName: null }))
      )
    );
    missing.forEach((uid, index) => {
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
