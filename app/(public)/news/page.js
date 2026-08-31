import { getNewsList } from '../../../lib/prismic';
import { getPageMeta } from '../../../lib/ogImage';
import { resolveSourceName } from '../../../lib/format';
import { effectivePublishedAt, sortByPublishedAt } from '../../../lib/publishedDate';
import NewsListClient from '../../../components/NewsListClient';

export const revalidate = 3600;

export const metadata = {
  title: 'News — Fox and Lion',
};

export default async function NewsListPage() {
  const posts = sortByPublishedAt(await getNewsList());

  // Same cached og:image fetch DefenceNewsList uses on the homepage — News
  // posts don't have their own cover image field, only a source_url.
  const metas = await Promise.all(posts.map((post) => getPageMeta(post.data.source_url)));

  const items = posts.map((post, index) => ({
    id: post.id,
    uid: post.uid,
    href: `/news/${post.uid}`,
    date: effectivePublishedAt(post),
    title: post.data.title,
    sourceUrl: post.data.source_url,
    sourceName: resolveSourceName(metas[index]?.siteName, post.data.source_url),
    coverImageUrl: metas[index]?.image,
  }));

  return (
    <div className="container" style={{ paddingTop: '2.5rem' }}>
      <h1>News</h1>
      <NewsListClient posts={items} />
    </div>
  );
}
