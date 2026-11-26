import CamoGenerator from '../../../../components/camo/CamoGenerator';

const TITLE = 'Camouflage Generator — Fox and Lion';
const DESCRIPTION =
  'Generate an original camouflage pattern from a seed, then share it by link or download it as a phone wallpaper or a LinkedIn banner.';
// Same default share image as the rest of the site (see app/layout.js) -
// a page-level openGraph replaces the layout's whole object, image included.
const SOCIAL_IMAGE = { url: '/og-default.png', width: 1200, height: 630, alt: 'Fox and Lion' };

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  // Unlisted for now: nothing on the site links here, and noindex keeps it
  // out of search results. Remove this line when the page goes public.
  robots: { index: false, follow: false },
  openGraph: {
    type: 'website',
    siteName: 'Fox and Lion',
    title: TITLE,
    description: DESCRIPTION,
    url: '/tools/camo',
    images: [SOCIAL_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [SOCIAL_IMAGE.url],
  },
};

export default function CamoPage() {
  return (
    <div className="container page">
      <h1>Camouflage Generator</h1>
      <p className="camo__intro">
        Generate an original camouflage pattern from a seed. Choose a pattern family, a terrain,
        the number of colours, and the scale, then share the link or download the result as a phone
        wallpaper or a LinkedIn banner.
      </p>
      <CamoGenerator />
    </div>
  );
}
