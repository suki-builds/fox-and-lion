// Extracts a video ID from a News post's sourceUrl when it's a YouTube
// link, so the News detail page can embed the video instead of only
// linking out. Handles the two forms these URLs actually take:
// youtube.com/watch?v=ID (with or without extra query params like &t=)
// and the youtu.be/ID short link. Returns null for anything else.
export function extractYouTubeId(url) {
  if (!url) return null;
  try {
    const { hostname, pathname, searchParams } = new URL(url);
    const host = hostname.replace(/^(www|m)\./, '');

    if (host === 'youtu.be') {
      return pathname.slice(1).split('/')[0] || null;
    }

    if (host === 'youtube.com' && pathname === '/watch') {
      return searchParams.get('v');
    }

    return null;
  } catch {
    return null;
  }
}
