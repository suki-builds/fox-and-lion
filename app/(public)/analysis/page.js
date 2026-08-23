import { getAnalysisList } from '../../../lib/prismic';
import PostCard from '../../../components/PostCard';
import { coverImageSrc } from '../../../lib/prismicImage';
import { effectivePublishedAt, sortByPublishedAt } from '../../../lib/publishedDate';

export const revalidate = 3600;

export const metadata = {
  title: 'Analysis — Fox and Lion',
};

export default async function AnalysisListPage() {
  const posts = sortByPublishedAt(await getAnalysisList());

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
            href={`/analysis/${post.uid}`}
            date={effectivePublishedAt(post)}
            title={post.data.title}
            byline={post.data.author}
            category={post.data.category || 'Analysis'}
            coverImageUrl={coverImageSrc(post.data.cover_image?.url)}
            coverImageAlt={post.data.cover_image?.alt}
            coverRatio
          />
        ))}
      </div>
    </div>
  );
}
