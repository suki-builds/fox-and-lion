import { NextResponse } from 'next/server';
import { asText } from '@prismicio/client';
import { getAnalysisList, getNewsList } from '../../../lib/prismic';
import { effectivePublishedAt } from '../../../lib/publishedDate';

// Powers the site search overlay (components/SearchOverlay.js). Time-based
// ISR here matches every other page (1hr), and app/api/revalidate/route.js
// also revalidates this path on-demand whenever an Analysis or News
// webhook fires — so this refreshes on the same schedule as the rest of
// the site rather than needing its own cache strategy.
//
// Careers is deliberately excluded — at ~2,600+ live roles across the
// three boards it's far too large for a client-side fuzzy-search payload,
// and freetext search isn't the right tool for job discovery anyway (the
// existing company/role/location/workplace filters on /careers handle that).
// The search overlay links out to /careers instead of indexing it.
export const revalidate = 3600;

export async function GET() {
  const [analysisPosts, newsPosts] = await Promise.all([getAnalysisList(), getNewsList()]);

  const analysisItems = analysisPosts.map((post) => ({
    type: 'Analysis',
    title: post.data.title,
    excerpt: asText(post.data.excerpt) || '',
    url: `/analysis/${post.uid}`,
    date: effectivePublishedAt(post),
  }));

  const newsItems = newsPosts.map((post) => ({
    type: 'News',
    title: post.data.title,
    excerpt: post.data.seo_description || '',
    url: `/news/${post.uid}`,
    date: effectivePublishedAt(post),
  }));

  return NextResponse.json([...analysisItems, ...newsItems]);
}
