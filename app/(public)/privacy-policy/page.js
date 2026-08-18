export const metadata = {
  title: 'Privacy Policy — Fox and Lion',
};

// Static page (not pulled from DatoCMS) since this changes rarely — edit
// this file directly when the policy is updated. Source: Fox_and_Lion_Privacy_Policy.md.
export default function PrivacyPolicyPage() {
  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '3rem' }}>
      <h1>Privacy Policy</h1>

      <div className="article-body">
        <p>
          <strong>Last updated: 18 August 2026</strong>
        </p>

        <p>
          Fox and Lion is committed to protecting the privacy of everyone who visits this
          website or submits information to us. This policy explains what personal data we
          collect, why we collect it, how we use it, and the rights available to you under
          UK data protection law.
        </p>

        <h2>1. Who we are</h2>
        <p>
          Fox and Lion is an independent publication covering defence technology and
          related analysis, based in the United Kingdom. For the purposes of UK GDPR, Fox
          and Lion is the data controller for the personal data described in this policy.
        </p>
        <p>
          If you have any questions about this policy or how your data is handled, you can
          contact us at{' '}
          <a href="mailto:enquiries@advancedgrowinglabs.com">
            enquiries@advancedgrowinglabs.com
          </a>
          .
        </p>

        <h2>2. What data we collect</h2>
        <p>We currently collect personal data in the following circumstance:</p>
        <p>
          <strong>Submission Portal.</strong> When you submit a pitch for publication
          through our Submission Portal, we collect:
        </p>
        <ul>
          <li>First name and last name</li>
          <li>Email address</li>
          <li>Professional biography (as provided by you)</li>
          <li>The text of your pitch</li>
        </ul>
        <p>
          We do not currently collect any other personal data through the website, such as
          through account creation, comments, or newsletter sign-up. This policy will be
          updated if that changes.
        </p>
        <p>
          <strong>Cookies and analytics.</strong> We use Vercel Analytics (free tier) to
          understand how visitors use our website, such as which pages are viewed and how
          visitors arrive at the site. Vercel Analytics does not use cookies; instead,
          visitors are identified during their visit using a short-lived hash generated
          from their request, which is automatically discarded after 24 hours and is not
          used to track visitors across sessions or other websites. We do not currently use
          any other analytics, advertising, or tracking cookies on this site.
        </p>

        <h2>3. Why we collect this data and our legal basis</h2>
        <p>
          We collect the information submitted through the Submission Portal in order to
          review and consider your pitch for publication, and to contact you about the
          outcome of that review. Our legal basis for processing this data is legitimate
          interest: specifically, our interest in operating an editorial submissions
          process.
        </p>
        <p>
          Where you provide information voluntarily and it is not necessary for us to
          process your pitch, we may instead rely on consent, which you may withdraw at any
          time by contacting us.
        </p>

        <h2>4. Who has access to your data</h2>
        <p>
          Submission data is stored in DatoCMS, our content management platform, and is
          accessible only to Fox and Lion&rsquo;s editorial team. We do not sell, rent, or
          share your personal data with third parties for marketing purposes.
        </p>
        <p>
          Our website is hosted on Vercel. Vercel may process limited technical data (such
          as IP addresses) as part of standard web hosting and delivery, in accordance with
          its own privacy policy.
        </p>

        <h2>5. How long we keep your data</h2>
        <p>
          We retain submission data for as long as necessary to review your pitch and,
          where a pitch is accepted, to correspond with you about publication. Where a
          pitch is declined, we delete the submission record within 6 months of that
          decision.
        </p>

        <h2>6. Your rights</h2>
        <p>Under UK GDPR, you have the right to:</p>
        <ul>
          <li>Request access to the personal data we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Object to or restrict our processing of your data</li>
          <li>Withdraw consent, where consent is the basis for processing</li>
          <li>
            Lodge a complaint with the Information Commissioner&rsquo;s Office (ICO), the
            UK&rsquo;s data protection regulator, if you believe your data has been
            mishandled
          </li>
        </ul>
        <p>
          To exercise any of these rights, please contact us at{' '}
          <a href="mailto:enquiries@advancedgrowinglabs.com">
            enquiries@advancedgrowinglabs.com
          </a>
          .
        </p>

        <h2>7. Children&rsquo;s data</h2>
        <p>
          Fox and Lion&rsquo;s Submission Portal is intended for use by adults submitting
          professional or editorial content. We do not knowingly collect personal data from
          children.
        </p>

        <h2>8. Changes to this policy</h2>
        <p>
          We may update this policy from time to time, for example as new features are
          added to the website. Any changes will be posted on this page with an updated
          revision date.
        </p>

        <h2>9. Contact us</h2>
        <p>
          If you have questions about this policy or how your data is handled, please
          contact us at{' '}
          <a href="mailto:enquiries@advancedgrowinglabs.com">
            enquiries@advancedgrowinglabs.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}
