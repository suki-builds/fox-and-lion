import { getNewsList } from '../../../lib/prismic';
import { getPageMeta } from '../../../lib/ogImage';
import { resolveSourceName } from '../../../lib/format';
import { effectivePublishedAt, sortByPublishedAt } from '../../../lib/publishedDate';
import PostCard from '../../../components/PostCard';
import VoteButtons from '../../../components/VoteButtons';

export const revalidate = 3600;

export const metadata = {
  title: 'News — Fox and Lion',
};

export default async function NewsListPage() {
  const posts = sortByPublishedAt(await getNewsList());

  // Same cached og:image fetch DefenceNewsList uses on the homepage — News
  // posts don't have their own cover image field, only a source_url.
  const metas = await Promise.all(posts.map((post) => getPageMeta(post.data.source_url)));

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
            href={`/news/${post.uid}`}
            date={effectivePublishedAt(post)}
            title={post.data.title}
            sourceUrl={post.data.source_url}
            sourceName={resolveSourceName(metas[index]?.siteName, post.data.source_url)}
            coverImageUrl={metas[index]?.image}
            compact
            voteWidget={<VoteButtons postUid={post.uid} />}
          />
        ))}
      </div>
    </div>
  );
}
