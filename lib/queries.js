// GraphQL queries against the DatoCMS models.
// Field names here (title, slug, body, etc.) must match what you name the
// fields when you build these models in the DatoCMS admin — see README.md
// for the exact model setup.

export const ANALYSIS_LIST_QUERY = `
  query AnalysisList {
    allAnalysisPosts(orderBy: publishedDate_DESC, first: 100) {
      id
      title
      slug
      excerpt
      publishedDate
      author
      category
      coverImage {
        url
        alt
      }
    }
  }
`;

export const ANALYSIS_DETAIL_QUERY = `
  query AnalysisDetail($slug: String) {
    analysisPost(filter: { slug: { eq: $slug } }) {
      title
      slug
      excerpt
      publishedDate
      author
      category
      coverImage {
        url
        alt
      }
      seoTags {
        title
        description
        twitterCard
        noIndex
        image {
          url
          width
          height
          alt
        }
      }
      body {
        value
        blocks {
          __typename
          ... on ImageBlockRecord {
            id
            asset {
              url
              alt
              title
              width
              height
            }
          }
        }
      }
    }
  }
`;

// publishedAt (manually entered, optional) and _firstPublishedAt (system
// field, always populated) are both fetched so display/sort logic can use
// publishedAt when an editor has set it and fall back to _firstPublishedAt
// otherwise — see lib/newsDate.js. orderBy here is just a sane baseline
// (guaranteed non-null); every consumer re-sorts by the effective date
// itself since DatoCMS can't sort by a fallback expression server-side.
export const NEWS_LIST_QUERY = `
  query NewsList {
    allNewsPosts(orderBy: _firstPublishedAt_DESC, first: 100) {
      id
      title
      slug
      sourceUrl
      publishedAt
      _firstPublishedAt
    }
  }
`;

export const NEWS_DETAIL_QUERY = `
  query NewsDetail($slug: String) {
    newsPost(filter: { slug: { eq: $slug } }) {
      title
      slug
      sourceUrl
      publishedAt
      _firstPublishedAt
      seoTags {
        title
        description
        twitterCard
        noIndex
        image {
          url
          width
          height
          alt
        }
      }
      commentary {
        value
      }
    }
  }
`;

// Deliberately minimal — these two feed the search index (see
// app/api/search-index/route.js). Only what's needed to match against and
// render a result row: no cover images, author bylines, or body content.
// (Careers is deliberately not indexed — see that route's own comment.)
export const SEARCH_ANALYSIS_QUERY = `
  query SearchAnalysis {
    allAnalysisPosts(orderBy: publishedDate_DESC, first: 100) {
      title
      slug
      excerpt
      publishedDate
    }
  }
`;

export const SEARCH_NEWS_QUERY = `
  query SearchNews {
    allNewsPosts(orderBy: _firstPublishedAt_DESC, first: 100) {
      title
      slug
      publishedAt
      _firstPublishedAt
      seoTags {
        description
      }
    }
  }
`;
