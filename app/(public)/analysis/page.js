import { fetchFromDato } from '../../../lib/datocms';
import { ANALYSIS_LIST_QUERY } from '../../../lib/queries';
import PostCard from '../../../components/PostCard';

export const revalidate = 3600;

export const metadata = {
  title: 'Analysis — Fox and Lion',
};

export default async function AnalysisListPage() {
  const data = await fetchFromDato(ANALYSIS_LIST_QUERY);
  const posts = data.allAnalysisPosts;

  return (
    <div className="container" style={{ paddingTop: '2.5rem' }}>
      <h1>Analysis</h1>
      <div className="post-grid" style={{ marginTop: '2rem' }}>
        {posts.length === 0 && (
          <p style={{ padding: '1.5rem' }}>Nothing published yet.</p>
        )}
        {posts.map((post) => (
          <PostCard
            key={post.id}
            href={`/analysis/${post.slug}`}
            date={post.publishedDate}
            title={post.title}
            excerpt={post.excerpt}
            byline={post.author}
            category="Analysis"
            coverImageUrl={post.coverImage?.url}
            coverImageAlt={post.coverImage?.alt}
          />
        ))}
      </div>
    </div>
  );
}
