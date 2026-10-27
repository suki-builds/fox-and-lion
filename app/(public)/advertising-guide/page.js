import Link from 'next/link';

export const metadata = {
  title: 'Advertising Guide — Fox and Lion',
};

// Static page, same as the other guidelines pages - edit this file
// directly. PLACEHOLDER COPY: everything below is dummy text to be replaced
// with the real advertising terms.
export default function AdvertisingGuidePage() {
  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '3rem' }}>
      <h1>Advertising Guide</h1>

      <div className="article-body">
        <p>
          <em>Placeholder text &mdash; to be replaced with the final advertising guide.</em>
        </p>
        <p>
          Fox and Lion is read by people who build, buy, fund and use defence technology
          across the UK and Europe. Advertising with us puts your organisation in front of
          that audience, alongside analysis and news they come to us for. Lorem ipsum
          dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
          labore et dolore magna aliqua.
        </p>

        <h2>Our Audience</h2>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Our readers include
          founders, engineers, investors, procurement officials, civil servants and serving
          and former members of the armed forces. Ut enim ad minim veniam, quis nostrud
          exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>

        <h2>Formats</h2>
        <ul>
          <li>
            <strong>Leaderboard banner</strong> &mdash; 728&times;90 on desktop, 320&times;50
            on mobile, shown at the top of every page.
          </li>
          <li>
            <strong>Careers listing</strong> &mdash; a featured position at the top of the
            Careers board. Duis aute irure dolor in reprehenderit.
          </li>
          <li>
            <strong>Newsletter placement</strong> &mdash; a short text advert in the
            newsletter. Excepteur sint occaecat cupidatat non proident.
          </li>
        </ul>

        <h2>Creative Specifications</h2>
        <p>
          Lorem ipsum dolor sit amet: banners should be supplied as PNG or JPG at the exact
          sizes above, under 150KB, with a single destination URL. Animated or
          auto-playing creative is not accepted. Sed ut perspiciatis unde omnis iste natus
          error sit voluptatem accusantium doloremque laudantium.
        </p>

        <h2>Rates and Booking</h2>
        <p>
          Rates are available on request. Nemo enim ipsam voluptatem quia voluptas sit
          aspernatur aut odit aut fugit. Bookings are confirmed once creative has been
          received and approved.
        </p>

        <h2>What We Don&rsquo;t Accept</h2>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. We reserve the right to
          decline any advertisement at our discretion. Advertising never influences our
          editorial coverage.
        </p>

        <h2>Get in Touch</h2>
        <p>
          To discuss advertising with Fox and Lion, please <Link href="/contact">contact
          us</Link>. See also our <Link href="/sponsorship-guide">Sponsorship Guide</Link>.
        </p>
      </div>
    </div>
  );
}
