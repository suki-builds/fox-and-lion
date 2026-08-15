import { NextResponse } from 'next/server';
import { fetchFromDato } from '../../../lib/datocms';
import { SEARCH_ANALYSIS_QUERY, SEARCH_NEWS_QUERY } from '../../../lib/queries';

// Powers the site search overlay (components/SearchOverlay.js). Time-based
// ISR here matches every other page (1hr), and app/api/revalidate/route.js
// also revalidates this path on-demand whenever an Analysis or News
// webhook fires — so this refreshes on the same schedule as the rest of
// the site rather than needing its own cache strategy.
//
// Careers is deliberately excluded — at ~2,600+ live roles across the
// three boards it's far too large for a client-side fuzzy-search payload,
// and freetext search isn't the right tool for job discovery anyway (the
// existing company/role/location/workplace filters on /jobs handle that).
// The search overlay links out to /jobs instead of indexing it.
export const revalidate = 3600;

export async function GET() {
  const [analysisData, newsData] = await Promise.all([
    fetchFromDato(SEARCH_ANALYSIS_QUERY),
    fetchFromDato(SEARCH_NEWS_QUERY),
  ]);

  const analysisItems = analysisData.allAnalysisPosts.map((post) => ({
    type: 'Analysis',
    title: post.title,
    excerpt: post.excerpt || '',
    url: `/analysis/${post.slug}`,
    date: post.publishedDate,
  }));

  const newsItems = newsData.allNewsPosts.map((post) => ({
    type: 'News',
    title: post.title,
    excerpt: post.seoTags?.description || '',
    url: `/news/${post.slug}`,
    date: post.publishedAt,
  }));

  return NextResponse.json([...analysisItems, ...newsItems]);
}
