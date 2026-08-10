import Link from 'next/link';

export const metadata = {
  title: 'About — Fox and Lion',
};

// Static page (not pulled from DatoCMS) since this changes rarely — edit
// this file directly when the copy is updated. Source: About V01.docx.
export default function AboutPage() {
  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '3rem' }}>
      <h1>About</h1>

      <div className="article-body">
        <h2>Who We Are</h2>
        <p>
          Fox and Lion is a defence technology publication and community, founded by two
          former military officers whose service has spanned platoon to division level,
          across line and senior headquarters roles in Europe, North America, and East
          Asia.
        </p>
        <p>
          We are concerned with the meeting point of defence policy, procurement, and
          emerging technology, and with what is genuinely taking place on the battlefield
          and in the boardroom, rather than what is merely said about either.
        </p>

        <h2>What We Cover</h2>
        <ul>
          <li>Defence procurement and capability gaps</li>
          <li>Defence technology startups building the next generation of military capability</li>
          <li>Defence venture capital and funding</li>
          <li>Industrial base resilience and the policy landscape shaping defence technology</li>
        </ul>

        <h2>What We Do</h2>
        <p>
          Fox and Lion brings together original analysis, a defence-focused jobs board,
          and curated news in a single place.
        </p>
        <ul>
          <li>
            <strong>Analysis</strong> &mdash; considered commentary and interviews on
            defence technology, procurement, policy, and industrial base reform, written
            by operators, founders, veterans, investors, and policy insiders.
          </li>
          <li>
            <strong>Defence Tech Jobs</strong> &mdash; a live jobs board carrying the
            latest open roles across the defence technology sector.
          </li>
          <li>
            <strong>News</strong> &mdash; a curated selection of the defence technology
            stories that merit attention, gathered in one place.
          </li>
        </ul>

        <h2>Who We Write For</h2>
        <p>
          Defence technology founders and operators, venture capital investors in
          dual-use and defence, serving and former military personnel, policy
          professionals, and anyone with a genuine interest in the future of defence and
          security.
        </p>

        <h2>Our Community</h2>
        <p>
          Fox and Lion is as much a community as a publication. What exists today grew
          out of conversations on Reddit and Discord, where serving personnel, veterans,
          and the wider defence technology community continue to meet for candid,
          non-tribal discussion.
        </p>
        <p>
          We have also begun bringing that community together in person, through Defence
          Tech Drinks, an informal gathering in London open to anyone &mdash; serving
          personnel, veterans, founders, operators, investors, and Whitehall alike.
        </p>

        <h2>Write For Us</h2>
        <p>
          We are pleased to publish contributors who have stood close enough to a subject
          to have earned an opinion on it. Those who have served in uniform, spent
          meaningful time in government or industry, or have a clear record of rigorous
          research, engineers, programme managers, and founders working at the sharp end
          of defence technology are equally welcome, as are promising voices earlier in
          their careers with something genuinely new to say.
        </p>
        <p>
          A full account of how to pitch, and what is expected of a submission may be
          found in our{' '}
          <Link href="/submission-guidelines">Contributors&rsquo; Guidelines</Link>.
        </p>

        <h2>Join the Team</h2>
        <p>
          We are always glad to hear from sharp, curious minds with a genuine interest in
          the future of defence technology.
        </p>
        <p>
          Proactive applications are warmly welcomed. Whether analyst, researcher,
          engineer, or journalist, those wishing to help shape this conversation are
          invited to get in touch. Serving personnel and veterans are especially
          encouraged to apply.
        </p>
        <p>
          We would ask that a CV be sent, together with a brief note on what you would
          bring to the team, to{' '}
          <a href="mailto:foxandlion@advancedgrowinglabs.com">
            foxandlion@advancedgrowinglabs.com
          </a>
          . Every application is read, and we will be in touch should a suitable
          opportunity arise.
        </p>

        <h2>Keep Up With Us</h2>
        <p>
          Contributors are warmly invited to subscribe, so that new analysis, jobs, and
          news may be delivered directly, or to follow along on{' '}
          <a href="https://www.linkedin.com/company/fox-and-lion/" target="_blank" rel="noopener noreferrer">
            LinkedIn
          </a>
          , Reddit, and X.
        </p>
      </div>
    </div>
  );
}
