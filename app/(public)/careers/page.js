import { fetchFromDato } from '../../../lib/datocms';
import { CAREERS_LIST_QUERY } from '../../../lib/queries';
import PostCard from '../../../components/PostCard';

export const revalidate = 3600;

export const metadata = {
  title: 'Careers — Fox and Lion',
};

export default async function CareersListPage() {
  const data = await fetchFromDato(CAREERS_LIST_QUERY);
  const posts = data.allCareersPosts;

  return (
    <div className="container" style={{ paddingTop: '2.5rem' }}>
      <h1>Careers</h1>
      <div className="post-grid" style={{ marginTop: '2rem' }}>
        {posts.length === 0 && (
          <p style={{ padding: '1.5rem' }}>Nothing published yet.</p>
        )}
        {posts.map((post) => (
          <PostCard
            key={post.id}
            href={`/careers/${post.slug}`}
            date={post.publishedDate}
            title={post.title}
            showMedia={false}
            category="Careers"
          />
        ))}
      </div>
    </div>
  );
}
