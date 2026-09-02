import * as prismic from '@prismicio/client';

// Reads content from Prismic. accessToken is only needed if the repository
// is set to private; harmless to pass undefined for a public repo.
//
// createClient() with an *unset* repository name doesn't throw - it just
// resolves every query to an empty result, which would silently render as
// "Nothing published yet." everywhere instead of a clear config error. The
// explicit check below turns that into a loud failure instead.
export function getPrismicClient() {
  const repositoryName = process.env.NEXT_PUBLIC_PRISMIC_REPOSITORY_NAME;
  if (!repositoryName) {
    throw new Error('NEXT_PUBLIC_PRISMIC_REPOSITORY_NAME is not set');
  }
  return prismic.createClient(repositoryName, {
    accessToken: process.env.PRISMIC_ACCESS_TOKEN || undefined,
  });
}

// document.first_publication_date is Prismic's own always-populated system
// timestamp (see lib/publishedDate.js) - used as the fetch-time ordering
// baseline for the same reason the old DatoCMS queries ordered by
// _firstPublishedAt: it's guaranteed non-null, unlike the manual
// published_at override. Every consumer re-sorts by the effective date
// after fetching, since neither API can sort server-side by a fallback
// expression.
const NEWEST_FIRST = { field: 'document.first_publication_date', direction: 'desc' };

export async function getAnalysisList() {
  const client = getPrismicClient();
  return client.getAllByType('analysis_post', { orderings: NEWEST_FIRST });
}

export async function getAnalysisBySlug(slug) {
  const client = getPrismicClient();
  try {
    return await client.getByUID('analysis_post', slug);
  } catch (err) {
    if (err instanceof prismic.NotFoundError) return null;
    throw err;
  }
}

export async function getNewsList() {
  const client = getPrismicClient();
  return client.getAllByType('news_post', { orderings: NEWEST_FIRST });
}

export async function getNewsBySlug(slug) {
  const client = getPrismicClient();
  try {
    return await client.getByUID('news_post', slug);
  } catch (err) {
    if (err instanceof prismic.NotFoundError) return null;
    throw err;
  }
}

export async function getCareersPostsList() {
  const client = getPrismicClient();
  return client.getAllByType('careers_post', { orderings: NEWEST_FIRST });
}

export async function getCareersPostByUID(uid) {
  const client = getPrismicClient();
  try {
    return await client.getByUID('careers_post', uid);
  } catch (err) {
    if (err instanceof prismic.NotFoundError) return null;
    throw err;
  }
}
