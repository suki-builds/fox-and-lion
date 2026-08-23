/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.prismic.io',
      },
    ],
    // Deliberately small and matched to the layout's actual widths
    // (cover crop ~1200px, article body ~680px, card thumbnails) instead
    // of Next's default 8 device sizes - every extra breakpoint is a
    // separate cache entry, and a separate first-time fetch against
    // Prismic's origin. See the bandwidth note in the migration plan -
    // this replaced a hand-rolled image proxy after the DatoCMS free-tier
    // asset bandwidth got exhausted in a single day.
    deviceSizes: [384, 680, 1200],
    imageSizes: [96, 132, 220],
    // Long-lived, matching the old proxy's `max-age=31536000, immutable` -
    // no reason to ever re-validate a Prismic asset against its origin.
    minimumCacheTTL: 31536000,
  },
  // Careers moved from /jobs to /careers - permanent redirect so existing
  // backlinks/bookmarks/search results don't 404.
  async redirects() {
    return [
      {
        source: '/jobs',
        destination: '/careers',
        permanent: true,
      },
      {
        source: '/jobs/:path*',
        destination: '/careers/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
