import { GraphQLClient } from 'graphql-request';

// Reads content from DatoCMS. Uses the draft token + query param when in
// preview mode, otherwise the standard read-only token for published content.
export async function fetchFromDato(query, variables = {}, isPreview = false) {
  const token = isPreview
    ? process.env.DATOCMS_DRAFT_API_TOKEN
    : process.env.DATOCMS_API_TOKEN;

  const client = new GraphQLClient(
    isPreview
      ? 'https://graphql.datocms.com/preview'
      : 'https://graphql.datocms.com',
    {
      headers: {
        authorization: `Bearer ${token}`,
      },
    }
  );

  return client.request(query, variables);
}
