#!/usr/bin/env node
// One-off migration: reads every Analysis and News entry out of DatoCMS
// and creates the equivalent Prismic documents (as drafts). Run once,
// manually, after the analysis_post/news_post page types exist in Prismic
// (see README.md's "Set up Prismic" section) — not part of the deployed
// app, and not meant to run more than once.
//
//   DATOCMS_API_TOKEN=... PRISMIC_WRITE_TOKEN=... NEXT_PUBLIC_PRISMIC_REPOSITORY_NAME=... node scripts/migrate-dato-to-prismic.mjs
//
// Deliberately self-contained (its own DatoCMS GraphQL query and fetch
// call, not lib/prismic.js) rather than depending on any lib/datocms*
// file, since those were retired from the live app as part of this
// migration and this script only ever needs to exist for this one run.
//
// This was written against @prismicio/client's Migration API as
// documented at the time of writing — since this script only runs once
// and isn't part of the deployed app, if a method name below has since
// changed, the fix is local to this file: check the error message and
// https://prismic.io/docs/migration-api-technical-reference.

import * as prismic from '@prismicio/client';

const DATOCMS_TOKEN = process.env.DATOCMS_API_TOKEN;
const PRISMIC_WRITE_TOKEN = process.env.PRISMIC_WRITE_TOKEN;
const PRISMIC_REPO = process.env.NEXT_PUBLIC_PRISMIC_REPOSITORY_NAME;
// Needed alongside PRISMIC_WRITE_TOKEN because the repo is private -
// createWriteClient's internal read calls (e.g. resolving the master ref
// before writing) fail with "Invalid access token" without it.
const PRISMIC_ACCESS_TOKEN = process.env.PRISMIC_ACCESS_TOKEN;

if (!DATOCMS_TOKEN || !PRISMIC_WRITE_TOKEN || !PRISMIC_REPO) {
  console.error(
    'Missing env vars. Required: DATOCMS_API_TOKEN, PRISMIC_WRITE_TOKEN, NEXT_PUBLIC_PRISMIC_REPOSITORY_NAME (plus PRISMIC_ACCESS_TOKEN if the repo is private)'
  );
  process.exit(1);
}

// --- DatoCMS read side ------------------------------------------------

async function fetchFromDato(query, variables = {}) {
  const res = await fetch('https://graphql.datocms.com', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${DATOCMS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) {
    throw new Error(`DatoCMS GraphQL error: ${JSON.stringify(json.errors)}`);
  }
  // DatoCMS reports account-level failures (e.g. exceeded plan limits) as a
  // 200 response whose `data` is a JSON:API-style error array rather than
  // the query result - not a standard GraphQL `errors` field, so the check
  // above doesn't catch it. Surface it clearly instead of letting a later
  // `undefined.length` crash stand in for the real cause.
  if (Array.isArray(json.data) && json.data[0]?.type === 'api_error') {
    const { code, details } = json.data[0].attributes;
    throw new Error(`DatoCMS API error (${code}): ${details?.message || 'no details'}`);
  }
  return json.data;
}

// Fuller than the live app's queries — this needs the raw, untransformed
// asset URL (not an imgix-cropped responsiveImage variant) so Prismic's
// Migration API can fetch and re-upload full-quality originals.
const ANALYSIS_QUERY = `
  query {
    allAnalysisPosts(first: 500) {
      id
      title
      slug
      excerpt
      author
      category
      publishedDate
      coverImage { url alt width height }
      body {
        value
        blocks {
          __typename
          ... on ImageBlockRecord {
            id
            asset { url alt title width height }
          }
          ... on ExternalVideoRecord {
            id
            externalVideo { url title provider providerUid thumbnailUrl }
          }
        }
      }
    }
  }
`;

const NEWS_QUERY = `
  query {
    allNewsPosts(first: 500) {
      id
      title
      slug
      sourceUrl
      publishedAt
      _firstPublishedAt
      commentary { value }
    }
  }
`;

// --- dast (DatoCMS Structured Text) -> Prismic Rich Text --------------

const MARK_TO_SPAN = { strong: 'strong', emphasis: 'em' };
// Marks with no direct Prismic span equivalent fall back to `label`, a
// generic styling hook Prismic does support - the frontend would need a
// matching CSS class (e.g. `.label-underline`) for these to render
// distinctly. Logged via `warn()` below whenever actually encountered so
// this is only a problem if the content actually uses one.
const MARK_TO_LABEL = { underline: 'underline', strikethrough: 'strikethrough', code: 'code', highlight: 'highlight' };

let warnings = [];
function warn(docTitle, message) {
  warnings.push(`[${docTitle}] ${message}`);
}

// Flattens a dast paragraph/heading/list-item's inline children (`span`
// and `link` nodes) into Prismic's {text, spans} shape.
function inlineToPrismic(children, docTitle) {
  let text = '';
  const spans = [];

  function walk(nodes, activeLink) {
    for (const node of nodes || []) {
      if (node.type === 'span') {
        const start = text.length;
        text += node.value;
        const end = text.length;
        for (const mark of node.marks || []) {
          if (MARK_TO_SPAN[mark]) {
            spans.push({ start, end, type: MARK_TO_SPAN[mark] });
          } else if (MARK_TO_LABEL[mark]) {
            spans.push({ start, end, type: 'label', data: { label: MARK_TO_LABEL[mark] } });
            warn(docTitle, `mark "${mark}" migrated as a "label" span - add matching CSS if this needs distinct styling`);
          } else {
            warn(docTitle, `unrecognized mark "${mark}" dropped`);
          }
        }
        if (activeLink) {
          spans.push({ start, end, type: 'hyperlink', data: { link_type: 'Web', url: activeLink } });
        }
      } else if (node.type === 'link') {
        walk(node.children, node.url);
      } else if (node.type === 'itemLink') {
        warn(docTitle, 'itemLink (internal record link) not supported by this converter - rendered as plain text');
        walk(node.children, activeLink);
      } else {
        warn(docTitle, `unrecognized inline node type "${node.type}" skipped`);
      }
    }
  }

  walk(children);
  return { text, spans };
}

const HEADING_TYPE = { 1: 'heading1', 2: 'heading2', 3: 'heading3', 4: 'heading4', 5: 'heading5', 6: 'heading6' };

// Converts a dast root's children to a flat Prismic Rich Text array.
// `blocks` is the structured text field's own `blocks` array (embedded
// records referenced by dast `block` nodes' `item` id). `migration` is
// needed here (not just for cover images) because a rich text image node
// in the Migration API must reference an uploaded asset via
// `migration.createAsset()` - a bare `url` field fails validation
// ("data.body.N.id: The value must be a string").
function dastToPrismicRichText(dast, blocks, docTitle, migration) {
  if (!dast) return [];
  const result = [];

  function pushBlockRecord(itemId) {
    const record = (blocks || []).find((b) => b.id === itemId);
    if (!record) {
      warn(docTitle, `block record id "${itemId}" not found in blocks array - skipped`);
      return;
    }
    if (record.__typename === 'ImageBlockRecord' && record.asset) {
      result.push({
        type: 'image',
        id: migration.createAsset(record.asset.url, `${docTitle}-body-image-${itemId}`, {
          alt: record.asset.alt || '',
          credits: record.asset.title || undefined,
        }),
      });
    } else if (record.__typename === 'ExternalVideoRecord' && record.externalVideo) {
      const video = record.externalVideo;
      result.push({
        type: 'embed',
        oembed: {
          type: 'video',
          embed_url: video.url,
          title: video.title || '',
          provider_name: video.provider || '',
          thumbnail_url: video.thumbnailUrl || null,
          html: '',
        },
      });
    } else {
      warn(docTitle, `unrecognized block record type "${record.__typename}" skipped`);
    }
  }

  function pushListItems(items, ordered) {
    for (const item of items) {
      // A list item's own children are block nodes (usually a single
      // paragraph) - only the first is used, matching what every editor
      // actually produces in DatoCMS's list-item editor.
      const para = (item.children || []).find((c) => c.type === 'paragraph');
      const { text, spans } = inlineToPrismic(para?.children, docTitle);
      result.push({ type: ordered ? 'o-list-item' : 'list-item', text, spans });
    }
  }

  for (const node of dast.children || []) {
    if (node.type === 'paragraph') {
      const { text, spans } = inlineToPrismic(node.children, docTitle);
      result.push({ type: 'paragraph', text, spans });
    } else if (node.type === 'heading') {
      const { text, spans } = inlineToPrismic(node.children, docTitle);
      result.push({ type: HEADING_TYPE[node.level] || 'heading6', text, spans });
    } else if (node.type === 'list') {
      pushListItems(node.children || [], node.style === 'numbered');
    } else if (node.type === 'blockquote') {
      // Prismic Rich Text has no native blockquote node - migrated as a
      // paragraph with a "blockquote" label span over the whole line so
      // it can still be styled distinctly if the site's serializer wants
      // to (see MARK_TO_LABEL note above for the same pattern).
      for (const child of node.children || []) {
        if (child.type !== 'paragraph') continue;
        const { text, spans } = inlineToPrismic(child.children, docTitle);
        spans.push({ start: 0, end: text.length, type: 'label', data: { label: 'blockquote' } });
        result.push({ type: 'paragraph', text, spans });
      }
      warn(docTitle, 'blockquote migrated as a labeled paragraph - add ".label-blockquote" CSS if distinct styling is wanted');
    } else if (node.type === 'code') {
      result.push({ type: 'preformatted', text: node.code || '', spans: [] });
    } else if (node.type === 'block') {
      pushBlockRecord(node.item);
    } else {
      warn(docTitle, `unrecognized block-level node type "${node.type}" skipped`);
    }
  }

  return result;
}

// --- Markdown excerpt -> Prismic Rich Text -----------------------------
// Scoped to exactly what the excerpt field actually uses: paragraphs,
// bullet lists, and **bold**/*emphasis* - not a general Markdown parser.
function markdownToPrismicRichText(markdown, docTitle) {
  if (!markdown) return [];
  const lines = markdown.split('\n');
  const result = [];
  let currentList = null;

  function inlineMarkdownToSpans(line) {
    // Strips **bold**/*emphasis* while recording span ranges over the
    // resulting plain text - a small state machine rather than a full
    // parser, sufficient for the flat emphasis this field ever contains.
    let text = '';
    const spans = [];
    let i = 0;
    while (i < line.length) {
      const boldMatch = line.slice(i).match(/^\*\*([^*]+)\*\*/);
      const emMatch = line.slice(i).match(/^\*([^*]+)\*/);
      if (boldMatch) {
        const start = text.length;
        text += boldMatch[1];
        spans.push({ start, end: text.length, type: 'strong' });
        i += boldMatch[0].length;
      } else if (emMatch) {
        const start = text.length;
        text += emMatch[1];
        spans.push({ start, end: text.length, type: 'em' });
        i += emMatch[0].length;
      } else {
        text += line[i];
        i += 1;
      }
    }
    return { text, spans };
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      currentList = null;
      continue;
    }
    const bulletMatch = line.match(/^[-*+]\s+(.*)/);
    if (bulletMatch) {
      const { text, spans } = inlineMarkdownToSpans(bulletMatch[1]);
      result.push({ type: 'list-item', text, spans });
      currentList = 'bulleted';
      continue;
    }
    currentList = null;
    const { text, spans } = inlineMarkdownToSpans(line);
    result.push({ type: 'paragraph', text, spans });
  }

  return result;
}

// --- Prismic write side -------------------------------------------------

// Prismic's Timestamp field rejects the standard `.toISOString()` output
// ("2026-06-26T00:00:00.000Z") - it requires "+0000" instead of "Z" and no
// milliseconds ("2026-06-26T00:00:00+0000").
function toPrismicTimestamp(dateInput) {
  if (!dateInput) return null;
  return new Date(dateInput).toISOString().replace(/\.\d{3}Z$/, '+0000');
}

const writeClient = prismic.createWriteClient(PRISMIC_REPO, {
  writeToken: PRISMIC_WRITE_TOKEN,
  accessToken: PRISMIC_ACCESS_TOKEN,
});

async function migrateAnalysis(migration, post) {
  const bodyRichText = dastToPrismicRichText(post.body.value.document, post.body.blocks, post.title, migration);
  const excerptRichText = markdownToPrismicRichText(post.excerpt, post.title);

  const coverImage = post.coverImage
    ? migration.createAsset(post.coverImage.url, `${post.slug}-cover`, { alt: post.coverImage.alt || '' })
    : null;

  migration.createDocument(
    {
      type: 'analysis_post',
      uid: post.slug,
      lang: 'en-us',
      data: {
        title: post.title,
        excerpt: excerptRichText,
        author: post.author || '',
        category: post.category || '',
        cover_image: coverImage,
        body: bodyRichText,
        // See README's "Migrating from DatoCMS" note: this must be set
        // explicitly, or Prismic's own first_publication_date (the
        // migration run date) would silently reorder the back-catalogue.
        published_at: toPrismicTimestamp(post.publishedDate),
      },
    },
    post.title
  );
}

async function migrateNews(migration, post) {
  const commentaryRichText = dastToPrismicRichText(
    post.commentary.value.document,
    [],
    post.title,
    migration
  );
  const effectivePublishedAt = post.publishedAt ?? post._firstPublishedAt;

  migration.createDocument(
    {
      type: 'news_post',
      uid: post.slug,
      lang: 'en-us',
      data: {
        title: post.title,
        source_url: post.sourceUrl || '',
        commentary: commentaryRichText,
        published_at: toPrismicTimestamp(effectivePublishedAt),
      },
    },
    post.title
  );
}

// Some of the back-catalogue has already been hand-copied into Prismic
// directly (ahead of running this script), so a DatoCMS post is skipped
// if it matches an existing Prismic document either by UID or by title -
// Prismic truncates long slugs to a UID length limit, so a title match
// catches cases a slug match alone would miss. Without this, re-running
// the migration would create duplicate documents for anything already
// migrated by hand.
async function fetchExistingUidsAndTitles(readClient, type) {
  const docs = await readClient.getAllByType(type);
  return {
    uids: new Set(docs.map((d) => d.uid)),
    titles: new Set(docs.map((d) => d.data.title?.toLowerCase().trim())),
  };
}

async function main() {
  console.log('Checking for content already migrated by hand...');
  const readClient = prismic.createClient(PRISMIC_REPO, { accessToken: PRISMIC_ACCESS_TOKEN });
  const [existingAnalysis, existingNews] = await Promise.all([
    fetchExistingUidsAndTitles(readClient, 'analysis_post'),
    fetchExistingUidsAndTitles(readClient, 'news_post'),
  ]);

  console.log('Fetching from DatoCMS...');
  const [{ allAnalysisPosts }, { allNewsPosts }] = await Promise.all([
    fetchFromDato(ANALYSIS_QUERY),
    fetchFromDato(NEWS_QUERY),
  ]);
  console.log(`Found ${allAnalysisPosts.length} Analysis posts, ${allNewsPosts.length} News posts.`);

  const migration = prismic.createMigration();
  let skipped = 0;

  for (const post of allAnalysisPosts) {
    if (existingAnalysis.uids.has(post.slug) || existingAnalysis.titles.has(post.title.toLowerCase().trim())) {
      console.log(`  skipping (already in Prismic): ${post.slug}`);
      skipped += 1;
      continue;
    }
    await migrateAnalysis(migration, post);
  }
  for (const post of allNewsPosts) {
    if (existingNews.uids.has(post.slug) || existingNews.titles.has(post.title.toLowerCase().trim())) {
      console.log(`  skipping (already in Prismic): ${post.slug}`);
      skipped += 1;
      continue;
    }
    await migrateNews(migration, post);
  }
  console.log(`Skipped ${skipped} post(s) already present in Prismic.`);

  console.log('Uploading assets and creating documents in Prismic (this can take a while)...');
  await writeClient.migrate(migration, {
    reporter: (event) => console.log(`  ${event.type}`, event.data ?? ''),
  });

  console.log('\nDone. Every document above was created as a DRAFT - review and publish them in Prismic.');
  if (warnings.length > 0) {
    console.log(`\n${warnings.length} conversion warning(s):`);
    for (const w of warnings) console.log(`  - ${w}`);
  } else {
    console.log('\nNo conversion warnings.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
