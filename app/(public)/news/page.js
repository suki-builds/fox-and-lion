import { fetchFromDato } from '../../../lib/datocms';
import { NEWS_LIST_QUERY } from '../../../lib/queries';
import PostCard from '../../../components/PostCard';

export const revalidate = 3600;

export const metadata = {
  title: 'News — Fox and Lion',
};

export default async function NewsListPage() {
  const data = await fetchFromDato(NEWS_LIST_QUERY);
  const posts = data.allNewsPosts;

  return (
    <div className="container" style={{ paddingTop: '2.5rem' }}>
      <h1>News</h1>
      <div className="post-grid" style={{ marginTop: '2rem' }}>
        {posts.length === 0 && (
          <p style={{ padding: '1.5rem' }}>Nothing published yet.</p>
        )}
        {posts.map((post) => (
          <PostCard
            key={post.id}
            href={`/news/${post.slug}`}
            date={post.publishedDate}
            title={post.title}
            showMedia={false}
            category="News"
          />
        ))}
      </div>
    </div>
  );
}
