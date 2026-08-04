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
      coverImage {
        url
        alt
      }
      body {
        value
      }
    }
  }
`;

export const NEWS_LIST_QUERY = `
  query NewsList {
    allNewsPosts(orderBy: publishedDate_DESC) {
      id
      title
      slug
      sourceUrl
      publishedDate
    }
  }
`;

export const NEWS_DETAIL_QUERY = `
  query NewsDetail($slug: String) {
    newsPost(filter: { slug: { eq: $slug } }) {
      title
      slug
      sourceUrl
      publishedDate
      commentary {
        value
      }
    }
  }
`;

export const CAREERS_LIST_QUERY = `
  query CareersList {
    allCareersPosts(orderBy: publishedDate_DESC) {
      id
      title
      slug
      description
      applyUrl
      publishedDate
    }
  }
`;

export const CAREERS_DETAIL_QUERY = `
  query CareersDetail($slug: String) {
    careersPost(filter: { slug: { eq: $slug } }) {
      title
      slug
      description
      applyUrl
      publishedDate
    }
  }
`;
