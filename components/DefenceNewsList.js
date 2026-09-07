import { getBatchedThumbnails } from '../lib/newsThumbnails';
import { resolveSourceName } from '../lib/format';
import { effectivePublishedAt, sortByPublishedAt, isArchived } from '../lib/publishedDate';
import { getBatchedPostStats } from '../lib/postStats';
import HomeNewsList from './HomeNewsList';

const MAX_ITEMS = 4;

function formatDate(date) {
  if (!date) return null;
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// The homepage's News section — a compact list, image/headline/source all
// linking to Fox and Lion's own internal summary page for that item, not
// out to the original source article. Fetches everything server-side
// (thumbnails, an initial stats snapshot) and hands off to HomeNewsList
// (a Client Component) to render, refresh stats after load, and resolve the
// visitor's own vote - see components/PostStatsProvider.js.
export default async function DefenceNewsList({ posts }) {
  const items = sortByPublishedAt(posts || []).slice(0, MAX_ITEMS);

  if (items.length === 0) {
    return <p style={{ padding: '1.5rem 0' }}>Nothing published yet.</p>;
  }

  const uidToSourceUrl = {};
  items.forEach((post) => {
    if (post.data.source_url) uidToSourceUrl[post.uid] = post.data.source_url;
  });

  const [thumbnails, stats] = await Promise.all([
    getBatchedThumbnails(uidToSourceUrl),
    getBatchedPostStats('news', items.map((post) => post.uid)),
  ]);

  const listItems = items.map((post) => {
    const meta = thumbnails[post.uid] || { image: null, siteName: null };
    return {
      id: post.id,
      uid: post.uid,
      href: `/news/${post.uid}`,
      title: post.data.title,
      imageUrl: meta.image,
      sourceName: resolveSourceName(meta.siteName, post.data.source_url),
      formattedDate: formatDate(effectivePublishedAt(post)),
      archived: isArchived(post),
      stats: stats[post.uid],
    };
  });

  return <HomeNewsList items={listItems} />;
}
