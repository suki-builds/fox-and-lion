// The shared rule for data a page can't render correctly without.
//
// A failed read must never be mistaken for an empty or missing result. On
// 2026-09-13 a failed thumbnail read looked like an empty table and ended up
// erasing it; on 2026-09-14 a failed read rendered pages without thumbnails,
// and those blank pages were then cached for up to an hour. Both came from
// Supabase API gateway errors ("Failed to get project config", "Bad Gateway",
// "Gateway Timeout") that are usually gone within a second.
//
// So readers built on this:
//   1. retry, via withRetry, to ride out transient errors
//   2. at runtime, throw if every attempt fails. When a background
//      regeneration throws, Next keeps serving the last successfully
//      generated page and retries on the next request - so visitors keep
//      the page they already had instead of a cached broken one.
//   3. during `next build`, decide per reader (isBuildPhase) whether to
//      degrade or throw. Throwing there fails the whole deploy, which
//      leaves the previous deployment live - safe, but noisy. So degrade
//      where the fallback is cosmetic and temporary, and throw only where
//      degrading would bake in something wrong.

export const READ_ATTEMPTS = 3;

export function isBuildPhase() {
  return process.env.NEXT_PHASE === 'phase-production-build';
}

// Runs `read` up to READ_ATTEMPTS times, waiting 400ms then 800ms between
// attempts. `read` must throw on failure - supabase-js resolves with an
// `error` field rather than throwing, so wrap those calls and throw it.
export async function withRetry(read) {
  let lastError;
  for (let attempt = 1; attempt <= READ_ATTEMPTS; attempt += 1) {
    try {
      return await read();
    } catch (error) {
      lastError = error;
      if (attempt < READ_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
      }
    }
  }
  throw lastError;
}
