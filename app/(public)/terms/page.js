import Link from 'next/link';

export const metadata = {
  title: 'Terms & Conditions — Fox and Lion',
};

// Static page, same pattern as submission-guidelines/community-guidelines.
// Unlike the Community Guidelines (adapted from the team's own existing
// subreddit rules), this is placeholder/sample text with no source document
// behind it - terms covering content licensing and liability carry real
// legal weight, especially under the UK Online Safety Act now that this
// site accepts user comments. Treat this as a structural draft; it should
// be reviewed by a lawyer before relying on it.
export default function TermsPage() {
  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '3rem' }}>
      <h1>Terms &amp; Conditions</h1>

      <div className="article-body">
        <p>
          <em>
            This page is a placeholder starting point, not final legal copy. It should be
            reviewed by a lawyer before launch.
          </em>
        </p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By using Fox and Lion, including posting a comment, you agree to these Terms and
          to our{' '}
          <Link href="/community-guidelines">Community Guidelines</Link>. If you don&rsquo;t
          agree, please don&rsquo;t use the site.
        </p>

        <h2>2. User Content License</h2>
        <p>
          You retain ownership of any comment or other content you post. By posting, you
          grant Fox and Lion Ltd a worldwide, royalty-free license to host, display, and
          reproduce that content on the site. You are solely responsible for what you
          post.
        </p>

        <h2>3. Content Moderation</h2>
        <p>
          Fox and Lion may remove content, or suspend or restrict an account, for
          violating these Terms or the Community Guidelines, at its discretion and without
          prior notice.
        </p>

        <h2>4. Prohibited Conduct</h2>
        <p>
          You may not post content that is illegal, infringes another party&rsquo;s
          rights, impersonates another person or organisation, or otherwise violates the{' '}
          <Link href="/community-guidelines">Community Guidelines</Link>.
        </p>

        <h2>5. Reporting &amp; Moderation</h2>
        <p>
          Readers can report a comment they believe breaks these Terms or the Community
          Guidelines. Reports are reviewed by our moderators, who may remove the reported
          content or take other action as they judge appropriate.
        </p>

        <h2>6. Disclaimer of Warranties</h2>
        <p>
          Comments reflect the views of the individuals who posted them, not those of Fox
          and Lion. Content is provided &ldquo;as is&rdquo; without warranties of any kind.
        </p>

        <h2>7. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, Fox and Lion Ltd shall not be liable for
          any indirect, incidental, or consequential damages arising from your use of the
          site or reliance on any content posted by other users.
        </p>

        <h2>8. Termination</h2>
        <p>
          Fox and Lion may terminate or restrict your access to the site at any time for
          violating these Terms.
        </p>

        <h2>9. Governing Law</h2>
        <p>
          These Terms are governed by the laws of England and Wales.
        </p>

        <h2>10. Changes to These Terms</h2>
        <p>
          We may update these Terms from time to time. The current version will always be
          available on this page.
        </p>
      </div>
    </div>
  );
}
