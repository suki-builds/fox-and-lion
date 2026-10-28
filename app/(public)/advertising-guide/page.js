import Link from 'next/link';

export const metadata = {
  title: 'Advertising Guide — Fox and Lion',
};

// Static page, same as the other guidelines pages - edit this file
// directly. Source: Advertising Guide text.docx.
export default function AdvertisingGuidePage() {
  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '3rem' }}>
      <h1>Advertising Guide</h1>

      <div className="article-body">
        <p>
          <strong>
            Reach the people who build, buy, fund and use defence technology across the UK
            and Europe.
          </strong>
        </p>
        <p>Engage a powerful community at the intersection of defence, technology, and investment.</p>
        <p>
          Fox and Lion is a defence tech community and publication with a focus on the UK and
          Europe. Our readers include founders, operators, engineers, investors, officials, and
          serving and former members of the armed forces.
        </p>
        <p>
          Our analyses, news, and careers board help the community follow procurement, funding,
          industrial policy, and emerging technology, with the context needed to understand
          each development. Contributions come from people with direct first-hand experience in
          their field, including founders, engineers, investors and veterans.
        </p>
        <p>
          Fox and Lion also brings the community together through events, newsletters, and an
          online community. This connects the companies, funders and institutions that shape UK
          and European defence technology.
        </p>
        <p>
          We work with partners whose work is relevant to this community. Partnerships, from
          events to sponsored series, support independent analysis and give partners a clearly
          labelled way to reach the people they want to engage. Below are the ways to advertise
          with Fox and Lion.
        </p>
        <p>Every advertisement is kept separate from our editorial decisions.</p>

        <h2>Formats</h2>
        <p>
          <strong>Leaderboard banner.</strong> Desktop and mobile banners, shown at the top of
          every page.
        </p>
        <p>
          <strong>Careers listing.</strong> A featured position at the top of the Careers board.
        </p>
        <p>
          <strong>Newsletter placement.</strong> A short text &amp; image advert in our
          newsletters across several platforms.
        </p>
        <p>
          For events and sponsored content, see our{' '}
          <Link href="/sponsorship-guide">Sponsorship Guide</Link>.
        </p>

        <h2>Rates and Booking</h2>
        <p>
          Rates are available on request. Please use the <Link href="/contact">contact
          page</Link>, or email{' '}
          <a href="mailto:foxandlion@advancedgrowinglabs.com?subject=Advertising">
            foxandlion@advancedgrowinglabs.com
          </a>{' '}
          with &ldquo;Advertising&rdquo; in the subject line, and tell us your preferred
          format and dates. Bookings are confirmed once creative has been received and
          approved. Please allow 5 working days before your start date.
        </p>

        <h2>What We Do Not Accept</h2>
        <p>
          We reserve the right to decline any advertisement at our discretion, including
          advertising that is misleading, unlawful or inconsistent with our editorial
          standards. Advertising never influences our editorial coverage, and paid content is
          always labelled.
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
