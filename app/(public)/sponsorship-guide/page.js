import Link from 'next/link';

export const metadata = {
  title: 'Sponsorship Guide — Fox and Lion',
};

// Static page, same as the other guidelines pages - edit this file
// directly. PLACEHOLDER COPY: everything below is dummy text to be replaced
// with the real sponsorship terms.
export default function SponsorshipGuidePage() {
  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '3rem' }}>
      <h1>Sponsorship Guide</h1>

      <div className="article-body">
        <p>
          <em>Placeholder text &mdash; to be replaced with the final sponsorship guide.</em>
        </p>
        <p>
          Sponsorship lets organisations support Fox and Lion&rsquo;s independent analysis
          of defence technology while being recognised for it. Lorem ipsum dolor sit amet,
          consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
          magna aliqua.
        </p>

        <h2>Sponsorship Opportunities</h2>
        <ul>
          <li>
            <strong>Series sponsorship</strong> &mdash; support a multi-part analysis
            series. Ut enim ad minim veniam, quis nostrud exercitation.
          </li>
          <li>
            <strong>Newsletter sponsorship</strong> &mdash; presenting credit on an issue
            of the newsletter. Duis aute irure dolor in reprehenderit.
          </li>
          <li>
            <strong>Events and community</strong> &mdash; support for Fox and Lion events
            and the community. Excepteur sint occaecat cupidatat non proident.
          </li>
        </ul>

        <h2>Editorial Independence</h2>
        <p>
          Sponsors have no say over what we publish or how we cover it, including coverage
          of the sponsor itself. Sponsored content is always clearly labelled. Sed ut
          perspiciatis unde omnis iste natus error sit voluptatem accusantium.
        </p>

        <h2>Recognition</h2>
        <p>
          Lorem ipsum dolor sit amet: sponsors are credited by name and logo on the
          sponsored item. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit
          aut fugit, sed quia consequuntur magni dolores eos.
        </p>

        <h2>Eligibility</h2>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. We reserve the right to
          decline any sponsorship at our discretion. Neque porro quisquam est, qui dolorem
          ipsum quia dolor sit amet.
        </p>

        <h2>Get in Touch</h2>
        <p>
          To discuss sponsorship, please <Link href="/contact">contact us</Link>. For
          display advertising, see our <Link href="/advertising-guide">Advertising
          Guide</Link>.
        </p>
      </div>
    </div>
  );
}
