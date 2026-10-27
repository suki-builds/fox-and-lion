import PostCard from './PostCard';
import PostEngagement from './PostEngagement';
import PostStatsProvider from './PostStatsProvider';
import { coverImageSrc, imageAspectRatio } from '../lib/prismicImage';
import { effectivePublishedAt, isArchived } from '../lib/publishedDate';
import { getBatchedPostStats } from '../lib/postStats';

// The two-column grid of analysis cards used by the homepage's Recent
// Analysis section and the "More Analysis" list under each analysis post.
// `posts` is already chosen and ordered by the caller.
//
// The provider is what resolves each card's own vote client-side, which
// getBatchedPostStats deliberately can't do without dropping the page out
// of ISR - same as /analysis.
export default async function AnalysisGrid({ posts }) {
  const stats = await getBatchedPostStats('analysis', posts.map((post) => post.uid));

  return (
    <PostStatsProvider postType="analysis" uids={posts.map((post) => post.uid)} initialStats={stats}>
      <div className="recent-analysis-grid">
        {posts.length === 0 && <p style={{ padding: '1.5rem 0' }}>Nothing published yet.</p>}
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
            coverImageAspectRatio={imageAspectRatio(post.data.cover_image)}
            engagement={
              <PostEngagement
                postUid={post.uid}
                postType="analysis"
                archived={isArchived(post, 'analysis')}
              />
            }
          />
        ))}
      </div>
    </PostStatsProvider>
  );
}
