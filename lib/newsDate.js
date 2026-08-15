// News posts have two possible publish timestamps: the manually-entered
// `publishedAt` field (editors can set this to the source article's real
// publish time, which may differ from when the record was entered into
// DatoCMS) and the system `_firstPublishedAt` field (always populated,
// reflects when the record was first published in DatoCMS). `publishedAt`
// wins whenever it's set; `_firstPublishedAt` is the fallback for records
// where an editor left it blank.
export function effectivePublishedAt(post) {
  return post.publishedAt ?? post._firstPublishedAt;
}

// Sorts News posts newest-first by their effective publish date. DatoCMS
// can't sort by a fallback expression server-side, so every place that
// lists News posts re-sorts client-side using this after fetching.
export function sortNewsByPublishedAt(posts) {
  return [...posts].sort((a, b) => {
    const aDate = effectivePublishedAt(a) || '';
    const bDate = effectivePublishedAt(b) || '';
    return bDate.localeCompare(aDate);
  });
}
