// Both Analysis and News documents have two possible publish timestamps:
// the manually-entered `published_at` field (editors can set this to the
// content's real publish time, which may differ from when the record was
// entered into Prismic) and Prismic's own system `first_publication_date`
// (always populated, reflects when the document was first published).
// `published_at` wins whenever it's set; `first_publication_date` is the
// fallback for documents where an editor left it blank.
export function effectivePublishedAt(doc) {
  return doc.data.published_at ?? doc.first_publication_date;
}

// Sorts documents newest-first by their effective publish date. Prismic
// can't sort by a fallback expression server-side, so every place that
// lists Analysis or News documents re-sorts client-side using this after
// fetching.
export function sortByPublishedAt(docs) {
  return [...docs].sort((a, b) => {
    const aDate = effectivePublishedAt(a) || '';
    const bDate = effectivePublishedAt(b) || '';
    return bDate.localeCompare(aDate);
  });
}
