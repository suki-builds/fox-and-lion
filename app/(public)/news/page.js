import { fetchFromDato } from '../../../lib/datocms';
import { NEWS_LIST_QUERY } from '../../../lib/queries';
import { getPageMeta } from '../../../lib/ogImage';
import { resolveSourceName } from '../../../lib/format';
import { effectivePublishedAt, sortNewsByPublishedAt } from '../../../lib/newsDate';
import PostCard from '../../../components/PostCard';

export const revalidate = 3600;

export const metadata = {
  title: 'News — Fox and Lion',
};

export default async function NewsListPage() {
  const data = await fetchFromDato(NEWS_LIST_QUERY);
  const posts = sortNewsByPublishedAt(data.allNewsPosts);

  // Same cached og:image fetch DefenceNewsList uses on the homepage — News
  // posts don't have their own cover image field, only a sourceUrl.
  const metas = await Promise.all(posts.map((post) => getPageMeta(post.sourceUrl)));

  return (
    <div className="container" style={{ paddingTop: '2.5rem' }}>
      <h1>News</h1>
      <div className="post-grid" style={{ marginTop: '2rem' }}>
        {posts.length === 0 && (
          <p style={{ padding: '1.5rem' }}>Nothing published yet.</p>
        )}
        {posts.map((post, index) => (
          <PostCard
            key={post.id}
            href={`/news/${post.slug}`}
            date={effectivePublishedAt(post)}
            title={post.title}
            sourceUrl={post.sourceUrl}
            sourceName={resolveSourceName(metas[index]?.siteName, post.sourceUrl)}
            coverImageUrl={metas[index]?.image}
          />
        ))}
      </div>
    </div>
  );
}
