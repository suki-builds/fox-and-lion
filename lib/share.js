import { createClient } from './supabase/client';
import { getOrCreateVisitorId } from './visitorId';

// Shares the current page URL via the native share sheet where available,
// falling back to copying it to the clipboard - reads location.href at
// call time rather than needing the canonical URL passed down as a prop.
// Records a share via record_share() only when the action actually
// completed (the share sheet resolved, or the clipboard copy succeeded) -
// a dismissed share sheet isn't a share, so that case records nothing.
//
// Deliberately shares { url } alone, with no title/text - WebKit's
// navigator.share() treats a URL passed together with a separate title as
// two distinct share items (text + link) rather than one enrichable link,
// which skips iOS's automatic rich-preview fetch (real og:image + title)
// entirely and falls back to a generic icon. Sharing the URL alone lets
// iOS fetch and build that preview itself, exactly like pasting a link
// into Messages already did correctly.
//
// postUid/postType are optional - omit them (e.g. sharing a page with no
// News/Analysis post behind it) and the share still happens, it just
// isn't recorded anywhere.
export async function shareCurrentUrl({ postUid, postType } = {}) {
  const url = window.location.href;
  let outcome = null;

  if (navigator.share) {
    try {
      await navigator.share({ url });
      outcome = 'shared';
    } catch {
      // User dismissed the share sheet - nothing to do.
    }
  } else {
    try {
      await navigator.clipboard.writeText(url);
      outcome = 'copied';
    } catch {
      // Clipboard access denied - nothing more we can do here.
    }
  }

  if (outcome && postUid) {
    const supabase = createClient();
    // Fire-and-forget, same as ViewTracker's record_view call - the share
    // already happened from the reader's perspective regardless of whether
    // this succeeds.
    supabase
      .rpc('record_share', { ptype: postType, uid: postUid, visitor: getOrCreateVisitorId() })
      .then(() => {});
  }

  return outcome;
}
