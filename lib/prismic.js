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
    fetch: fetchWithRetry,
  });
}

// A deploy pre-builds ~900 pages, each with its own Prismic requests. On
// 2026-11-09 one of them got Prismic's "Service not available" page back,
// and that single failed page failed the whole deploy. Retrying a
// 429/5xx, a non-JSON answer or a network error rides out blips like that;
// anything else (a 404 included) is returned straight away.
const PRISMIC_ATTEMPTS = 4;

async function fetchWithRetry(input, init) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      const response = await fetch(input, init);
      // Prismic's API always answers in JSON, so an HTML page is an outage
      // page whatever its status code says.
      const isJson = (response.headers.get('content-type') || '').includes('json');
      const retryable = response.status === 429 || response.status >= 500 || !isJson;
      if (!retryable || attempt === PRISMIC_ATTEMPTS) return response;
    } catch (error) {
      if (attempt === PRISMIC_ATTEMPTS) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
  }
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

// Just the newest few, for the "More Analysis" list under each analysis
// post - see getLatestNews below.
export async function getLatestAnalysis(count) {
  const client = getPrismicClient();
  const response = await client.getByType('analysis_post', { orderings: NEWEST_FIRST, pageSize: count });
  return response.results;
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

// A News post with its Source URL left blank in Prismic is our own story,
// so it gets Fox and Lion's news page as its source - same as typing
// https://foxandlion.pub/news into the field. Applied to every news_post
// read, including the publish webhook's (app/api/revalidate/route.js).
export const DEFAULT_NEWS_SOURCE_URL = 'https://foxandlion.pub/news';

export function withNewsDefaults(doc) {
  if (doc?.data && !doc.data.source_url?.trim()) {
    doc.data.source_url = DEFAULT_NEWS_SOURCE_URL;
  }
  return doc;
}

export async function getNewsList() {
  const client = getPrismicClient();
  const posts = await client.getAllByType('news_post', { orderings: NEWEST_FIRST });
  return posts.map(withNewsDefaults);
}

// Just the newest few, for the "More news" list under each news post - one
// small page instead of getAllByType's walk through the whole archive.
// Fetched with some headroom because callers re-sort by effective date and
// drop the current post.
export async function getLatestNews(count) {
  const client = getPrismicClient();
  const response = await client.getByType('news_post', { orderings: NEWEST_FIRST, pageSize: count });
  return response.results.map(withNewsDefaults);
}

export async function getNewsBySlug(slug) {
  const client = getPrismicClient();
  try {
    return withNewsDefaults(await client.getByUID('news_post', slug));
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
