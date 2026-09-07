import { getAnalysisList } from '../../../lib/prismic';
import PostCard from '../../../components/PostCard';
import PostEngagement from '../../../components/PostEngagement';
import PostStatsProvider from '../../../components/PostStatsProvider';
import { coverImageSrc, imageAspectRatio } from '../../../lib/prismicImage';
import { effectivePublishedAt, sortByPublishedAt, isArchived } from '../../../lib/publishedDate';
import { getBatchedPostStats } from '../../../lib/postStats';

export const revalidate = 3600;

export const metadata = {
  title: 'Analysis — Fox and Lion',
};

export default async function AnalysisListPage() {
  const posts = sortByPublishedAt(await getAnalysisList());
  const stats = await getBatchedPostStats('analysis', posts.map((post) => post.uid));

  return (
    <div className="container" style={{ paddingTop: '2.5rem' }}>
      <h1>Analysis</h1>
      {/* The provider is what resolves each card's own vote. getBatchedPostStats
          can't do it server-side without calling cookies(), which would force
          this page out of ISR - so until it was added here, every arrow on this
          page rendered as unvoted no matter what you'd already voted on. */}
      <PostStatsProvider
        postType="analysis"
        uids={posts.map((post) => post.uid)}
        initialStats={stats}
      >
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
    </div>
  );
}
