import { getNewsList } from '../../../lib/prismic';
import { getBatchedThumbnails } from '../../../lib/newsThumbnails';
import { resolveSourceName } from '../../../lib/format';
import { effectivePublishedAt, sortByPublishedAt, isOlderThanDays, ARCHIVE_AFTER_DAYS } from '../../../lib/publishedDate';
import { getBatchedPostStats } from '../../../lib/postStats';
import NewsListClient from '../../../components/NewsListClient';

export const revalidate = 3600;

export const metadata = {
  title: 'News — Fox and Lion',
};

export default async function NewsListPage() {
  const posts = sortByPublishedAt(await getNewsList());

  // Thumbnails and stats (votes/views/comments/shares) are both single
  // batched Supabase reads regardless of list length now - see
  // lib/newsThumbnails.js and lib/postStats.js. Thumbnails used to be a
  // live scrape of each post's source article, expensive enough that only
  // the first page was ever fetched eagerly; that's gone now that they're
  // pre-scraped and stored (via the Prismic publish webhook) rather than
  // fetched at render time.
  const uidToSourceUrl = {};
  posts.forEach((post) => {
    if (post.data.source_url) uidToSourceUrl[post.uid] = post.data.source_url;
  });

  const [thumbnails, stats] = await Promise.all([
    getBatchedThumbnails(uidToSourceUrl),
    getBatchedPostStats('news', posts.map((post) => post.uid)),
  ]);

  const items = posts.map((post) => {
    const date = effectivePublishedAt(post);
    const meta = thumbnails[post.uid];
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
