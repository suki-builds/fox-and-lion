// GraphQL queries against the DatoCMS models.
// Field names here (title, slug, body, etc.) must match what you name the
// fields when you build these models in the DatoCMS admin — see README.md
// for the exact model setup.

export const ANALYSIS_LIST_QUERY = `
  query AnalysisList {
    allAnalysisPosts(orderBy: publishedDate_DESC) {
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

export const NEWS_LIST_QUERY = `
  query NewsList {
    allNewsPosts(orderBy: publishedAt_DESC) {
      id
      title
      slug
      sourceUrl
      publishedAt
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
