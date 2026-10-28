import Link from 'next/link';

export const metadata = {
  title: 'Sponsorship Guide — Fox and Lion',
};

// Static page, same as the other guidelines pages - edit this file
// directly. Source: Sponsorship Guide text.docx.
export default function SponsorshipGuidePage() {
  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '3rem' }}>
      <h1>Sponsorship Guide</h1>

      <div className="article-body">
        <p>
          <strong>
            Support independent defence technology analysis and a community that brings the
            sector together.
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
          labelled way to reach the people they want to engage. Below are the ways to sponsor
          Fox and Lion.
        </p>
        <p>Every sponsorship is kept separate from our editorial decisions.</p>

        <h2>Sponsorship Opportunities</h2>
        <p>
          <strong>Series sponsorship.</strong> Support a multi-part analysis series on a
          selected defence technology topic.
        </p>
        <p>
          <strong>Newsletter sponsorship.</strong> A presenting credit on an issue of our
          newsletters across several platforms.
        </p>
        <p>
          <strong>Events and community.</strong> Support for Fox and Lion offline events and
          our online community. Formats include:
        </p>
        <ul>
          <li>Bar/Restaurant Buy-Out (100&ndash;200 guests)</li>
          <li>Networking evening (50&ndash;100 guests)</li>
          <li>Casual pub night (&lt;30 guests)</li>
          <li>Dinner (&lt;15 guests)</li>
        </ul>
        <p>Event sponsorship is offered at several levels. Details are available on request.</p>

        <h2>Editorial Independence</h2>
        <p>
          Sponsors have no say over what we publish or how we cover it, including coverage of
          the sponsor itself. Sponsors do not review or approve editorial content before
          publication. Sponsored content is always clearly labelled.
        </p>
        <p>
          We do not share attendee or subscriber data with sponsors without the consent of the
          individuals concerned.
        </p>
        <p>We reserve the right to decline any sponsorship at our discretion.</p>

        <h2>Get in Touch</h2>
        <p>
          To discuss sponsorship, please <Link href="/contact">contact us</Link>, or email{' '}
          <a href="mailto:foxandlion@advancedgrowinglabs.com?subject=Sponsorship">
            foxandlion@advancedgrowinglabs.com
          </a>{' '}
          with &ldquo;Sponsorship&rdquo; in the subject line. For display advertising, see
          our <Link href="/advertising-guide">Advertising Guide</Link>.
        </p>
      </div>
    </div>
  );
}
