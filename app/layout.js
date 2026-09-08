import { Fraunces, IBM_Plex_Mono, Source_Sans_3 } from 'next/font/google';
import './globals.css';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import AdBanner from '../components/AdBanner';
import { Analytics } from '@vercel/analytics/next';

// Serif for headlines — Fraunces has the slightly formal, engraved weight
// that suits a defence/heraldic register without tipping into pastiche.
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

// Monospace for dates, bylines, and section labels — gives the
// document-like, dossier feel seen in the reference site.
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

// Clean sans for body copy — needs to stay legible at length, not stylised.
const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-body',
  display: 'swap',
});

const SITE_DESCRIPTION = 'UK and European defence technology analysis, news, and jobs.';

// The image used for the homepage and for any page that can't resolve one
// of its own (see lib/seo.js).
//
// Without this the site shipped no og:image at all, so link previews fell
// back to whatever a scraper found first in the DOM - which, because
// <AdBanner /> sits directly under the header in this layout, was the
// advertiser's banner. Sharing the homepage previewed as someone else's
// advert. Any article whose own image failed to resolve did the same.
//
// Flattened to RGB when it was added: it arrived as RGBA, and although its
// alpha was fully opaque (so nothing changed visually), some scrapers
// render PNG transparency as flat black or white rather than compositing
// it. Keep any replacement 1200x630 and without an alpha channel.
export const DEFAULT_SOCIAL_IMAGE = '/og-default.png';

export const metadata = {
  // Needed so the root-relative og:image/twitter:image URLs (see
  // lib/seo.js) resolve to absolute URLs - required by the OG/Twitter
  // spec, which crawlers won't resolve relative to the page themselves.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://foxandlion.pub'),
  title: 'Fox and Lion',
  description: SITE_DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: 'Fox and Lion',
    title: 'Fox and Lion',
    description: SITE_DESCRIPTION,
    url: '/',
    images: [{ url: DEFAULT_SOCIAL_IMAGE, width: 1200, height: 630, alt: 'Fox and Lion' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fox and Lion',
    description: SITE_DESCRIPTION,
    images: [DEFAULT_SOCIAL_IMAGE],
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${plexMono.variable} ${sourceSans.variable}`}
    >
      <body>
        <SiteHeader />
        <AdBanner />
        <main>{children}</main>
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
