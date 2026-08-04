import { Fraunces, IBM_Plex_Mono, Source_Sans_3 } from 'next/font/google';
import './globals.css';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';

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

export const metadata = {
  title: 'Fox and Lion',
  description: 'UK and European defence technology analysis, news, and jobs.',
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${plexMono.variable} ${sourceSans.variable}`}
    >
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
