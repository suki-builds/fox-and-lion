import { getNewsList } from '../../../lib/prismic';
import { getPageMeta } from '../../../lib/ogImage';
import { resolveSourceName } from '../../../lib/format';
import { effectivePublishedAt, sortByPublishedAt, isOlderThanDays, ARCHIVE_AFTER_DAYS } from '../../../lib/publishedDate';
import { getBatchedPostStats } from '../../../lib/postStats';
import NewsListClient, { PAGE_SIZE } from '../../../components/NewsListClient';

export const revalidate = 3600;

export const metadata = {
  title: 'News — Fox and Lion',
};

export default async function NewsListPage() {
  const posts = sortByPublishedAt(await getNewsList());

  // Thumbnails are the expensive part (a live fetch to each source
  // article) - only scrape them for the posts actually shown on first
  // load. The rest are fetched lazily as "Load more" reveals them (see
  // NewsListClient/app/api/news-thumbnails/route.js), instead of every
  // post ever published paying that cost on every page regeneration.
  // Stats (votes/views/comments/shares), by contrast, are a single cheap
  // indexed query regardless of how many posts there are, so those are
  // still batched for the full list up front.
  const [metas, stats] = await Promise.all([
    Promise.all(
      posts.slice(0, PAGE_SIZE).map((post) => getPageMeta(post.data.source_url))
    ),
    getBatchedPostStats('news', posts.map((post) => post.uid)),
  ]);

  const items = posts.map((post, index) => {
    const date = effectivePublishedAt(post);
    const meta = metas[index];
    return {
      id: post.id,
      uid: post.uid,
      href: `/news/${post.uid}`,
      date,
      archived: isOlderThanDays(date, ARCHIVE_AFTER_DAYS.news),
      title: post.data.title,
      sourceUrl: post.data.source_url,
      sourceName: meta ? resolveSourceName(meta.siteName, post.data.source_url) : null,
      coverImageUrl: meta?.image,
      stats: stats[post.uid],
    };
  });

  return (
    <div className="container" style={{ paddingTop: '2.5rem' }}>
      <h1>News</h1>
      <NewsListClient posts={items} />
    </div>
  );
}
