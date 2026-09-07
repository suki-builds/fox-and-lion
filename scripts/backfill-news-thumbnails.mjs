#!/usr/bin/env node
// One-off backfill: scrapes and stores a thumbnail for every News post
// that predates news_post_thumbnails (see
// supabase/migrations/0018_news_post_thumbnails.sql - run that migration
// in the Supabase SQL Editor first). Run once, manually:
//
//   NEXT_PUBLIC_PRISMIC_REPOSITORY_NAME=... PRISMIC_ACCESS_TOKEN=... NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/backfill-news-thumbnails.mjs
//
// Deliberately self-contained (its own copy of the scrape logic in
// lib/ogImage.js, not imported from it) rather than depending on Next's
// module resolution/env loading outside of `next dev`/`next build` -
// same rationale as scripts/migrate-dato-to-prismic.mjs.
//
// Throttles concurrency (CONCURRENCY below) rather than firing every
// post's scrape at once - unbounded concurrency against 20+ external
// sites from a single batch is what caused the incident this table
// exists to fix in the first place (see the migration file's comment).

import * as prismic from '@prismicio/client';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const PRISMIC_REPO = process.env.NEXT_PUBLIC_PRISMIC_REPOSITORY_NAME;
const PRISMIC_ACCESS_TOKEN = process.env.PRISMIC_ACCESS_TOKEN;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!PRISMIC_REPO || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    'Missing env vars. Required: NEXT_PUBLIC_PRISMIC_REPOSITORY_NAME, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (PRISMIC_ACCESS_TOKEN only if the repo is private)'
  );
  process.exit(1);
}

const CONCURRENCY = 5;

const OG_IMAGE_PATTERN =
  /<meta[^>]+(?:property|name)=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i;
const OG_IMAGE_PATTERN_REVERSED =
  /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image(?::secure_url)?["']/i;
const OG_SITE_NAME_PATTERN =
  /<meta[^>]+(?:property|name)=["']og:site_name["'][^>]+content=["']([^"']+)["']/i;
const OG_SITE_NAME_PATTERN_REVERSED =
  /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:site_name["']/i;

function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

async function scrapePageMeta(articleUrl) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(articleUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FoxAndLionBot/1.0)' },
    });
    clearTimeout(timeout);
    if (!res.ok) return { image: null, siteName: null };

    const html = await res.text();
    const imageMatch = html.match(OG_IMAGE_PATTERN) || html.match(OG_IMAGE_PATTERN_REVERSED);
    const siteNameMatch =
      html.match(OG_SITE_NAME_PATTERN) || html.match(OG_SITE_NAME_PATTERN_REVERSED);

    return {
      image: imageMatch ? new URL(decodeHtmlEntities(imageMatch[1]), articleUrl).toString() : null,
      siteName: siteNameMatch ? decodeHtmlEntities(siteNameMatch[1]).trim() : null,
    };
  } catch {
    return { image: null, siteName: null };
  }
}

async function main() {
  const prismicClient = prismic.createClient(PRISMIC_REPO, {
    accessToken: PRISMIC_ACCESS_TOKEN || undefined,
  });
  const supabase = createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log('Fetching News posts from Prismic...');
  const posts = await prismicClient.getAllByType('news_post');
  console.log(`Found ${posts.length} News posts.`);

  console.log('Checking which already have a stored thumbnail...');
  const { data: existing, error: readError } = await supabase
    .from('news_post_thumbnails')
    .select('post_uid');
  if (readError) {
    console.error('Failed to read news_post_thumbnails - has the migration been run?', readError.message);
    process.exit(1);
  }
  const alreadyDone = new Set((existing || []).map((row) => row.post_uid));

  const noSourceUrl = posts.filter((post) => !post.data.source_url).length;
  const toScrape = posts.filter((post) => post.data.source_url && !alreadyDone.has(post.uid));
  console.log(
    `${toScrape.length} post(s) need scraping (${alreadyDone.size} already done, ${noSourceUrl} have no source_url).`
  );

  let done = 0;
  let withImage = 0;
  let storageErrors = 0;

  async function worker(queue) {
    while (queue.length > 0) {
      const post = queue.shift();
      const meta = await scrapePageMeta(post.data.source_url);
      const { error } = await supabase
        .from('news_post_thumbnails')
        .upsert({ post_uid: post.uid, image_url: meta.image, site_name: meta.siteName }, { onConflict: 'post_uid' });
      done += 1;
      if (error) {
        storageErrors += 1;
        console.log(`  [${done}/${toScrape.length}] ERROR storing ${post.uid}: ${error.message}`);
      } else if (meta.image) {
        withImage += 1;
        console.log(`  [${done}/${toScrape.length}] ${post.uid} -> image found`);
      } else {
        console.log(`  [${done}/${toScrape.length}] ${post.uid} -> no image`);
      }
    }
  }

  const queue = [...toScrape];
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)));

  console.log(`\nDone. ${withImage}/${toScrape.length} scraped with an image, ${storageErrors} storage error(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
