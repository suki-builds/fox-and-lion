import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — Fox and Lion',
};

// Static page, same pattern as submission-guidelines/community-guidelines.
// Source: Fox_and_Lion_Forum_Terms_and_Conditions_v1.0.docx (Shared drive:
// AGL/Fox and Lion). Reproduced faithfully - this is the real, reviewed
// Terms of Service, not placeholder copy. Update this file directly when a
// new version is issued, and bump "Last updated"/"Version" below to match.
export default function TermsOfServicePage() {
  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '3rem' }}>
      <h1>Terms of Service</h1>
      <p style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--mono-stack)', fontSize: '0.85rem' }}>
        Last updated: 31 August 2026 &middot; Version 1.0
      </p>

      <div className="article-body">
        <h2>1. Introduction and Acceptance</h2>
        <p>
          These Terms of Service (&ldquo;Terms&rdquo;) govern access to and use of the
          discussion forum (&ldquo;Forum&rdquo;) operated as part of Fox and Lion at
          foxandlion.pub (the &ldquo;Service&rdquo;), operated by Jin Hyung Lee, trading as
          Fox and Lion (&ldquo;Fox and Lion&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;,
          &ldquo;our&rdquo;). Fox and Lion is not, at the time of publication, operated
          through an incorporated company, and the individual named above is personally
          responsible for the Service.
        </p>
        <p>
          By creating an account, posting, commenting, or otherwise using the Forum, you
          agree to be bound by these Terms. If you do not agree, you must not use the Forum.
        </p>
        <p>
          The Forum is currently offered as a beta feature. Functionality, moderation
          tooling, and these Terms may change materially and without extended notice while
          the Forum is in beta.
        </p>

        <h2>2. Eligibility</h2>
        <p>
          You must be at least 18 years old to register an account or post content on the
          Forum. By registering, you confirm that you meet this requirement and that the
          information you provide is accurate.
        </p>
        <p>
          We may refuse registration, or suspend or terminate an account, at our discretion,
          including where we reasonably believe a user does not meet this requirement.
        </p>

        <h2>3. Account Registration and Security</h2>
        <ul>
          <li>
            You are responsible for maintaining the confidentiality of your account
            credentials and for all activity that occurs under your account.
          </li>
          <li>You must notify us promptly of any unauthorised use of your account.</li>
          <li>
            Accounts are personal to the registering individual and may not be shared, sold,
            or transferred.
          </li>
          <li>
            We may require a verified email address and may use it to contact you about your
            account, moderation actions, or changes to these Terms.
          </li>
        </ul>

        <h2>4. User Content: Ownership and Licence</h2>

        <h3>4.1 You own what you post</h3>
        <p>
          You retain all ownership rights you hold in any text, comments, links, images, or
          other material you submit, post, or display on the Forum (&ldquo;User
          Content&rdquo;). These Terms do not transfer ownership of your User Content to us.
        </p>

        <h3>4.2 Licence you grant us</h3>
        <p>
          By submitting User Content, you grant Fox and Lion a worldwide, non-exclusive,
          royalty-free, sublicensable, and transferable licence to use, host, store,
          reproduce, modify (for formatting purposes only), distribute, publish, publicly
          display, and create derivative works of your User Content (such as excerpts or
          summaries), in connection with operating, promoting, and improving the Service,
          including on other Fox and Lion channels such as the newsletter or social media,
          with attribution to your username where practical.
        </p>
        <p>
          This licence continues after you delete your account or specific content, to the
          extent your content has been shared, cached, cited, or archived by other users or
          third parties before removal, and to the extent retention is required by law or
          for legitimate record-keeping (for example, in response to a legal complaint).
        </p>

        <h3>4.3 Your warranties</h3>
        <p>
          By posting User Content, you represent and warrant that you own or have the
          necessary rights and permissions to post it, and that it does not infringe the
          intellectual property, privacy, or other rights of any third party, and does not
          violate any applicable law, including defamation law.
        </p>

        <h2>5. Content Standards and Prohibited Conduct</h2>
        <p>You agree not to post content that:</p>
        <ul>
          <li>
            Is defamatory, or that you know or reasonably suspect to be false and damaging to
            a person or organisation&rsquo;s reputation;
          </li>
          <li>
            Is illegal, including content that would constitute an offence under the Online
            Safety Act 2023 or other applicable UK legislation;
          </li>
          <li>Infringes the intellectual property rights of any third party;</li>
          <li>
            Discloses classified, export-controlled, or otherwise legally restricted
            information, including material subject to the Official Secrets Act;
          </li>
          <li>Harasses, threatens, or incites violence against any individual or group;</li>
          <li>Is spam, unsolicited advertising, or coordinated inauthentic activity;</li>
          <li>
            Impersonates any person or entity, or misrepresents your affiliation with any
            person or entity;
          </li>
          <li>Contains malware or attempts to compromise the security of the Service or other users.</li>
        </ul>

        <h2 id="opsec">6. Operational Security (OPSEC)</h2>
        <p>
          Given the defence and national security subject matter of Fox and Lion, users must
          not post content that:
        </p>
        <ul>
          <li>
            Discloses classified, protectively marked, or otherwise officially restricted
            information, including material that may fall within the scope of the Official
            Secrets Act 1989;
          </li>
          <li>
            Reveals precise real-time or near-real-time locations, movements, or operational
            status of military personnel, units, platforms, or assets, whether based on
            personal knowledge, satellite imagery, or open-source analysis, where doing so
            could reasonably endanger personnel or compromise an ongoing operation;
          </li>
          <li>
            Aggregates otherwise public open-source information in a way that creates a
            materially greater operational security risk than the individual pieces of
            information carry on their own, for example compiling multiple partial sightings
            into a single tracking picture;
          </li>
          <li>
            Discloses information subject to UK strategic export controls, including dual-use
            items, or equivalent foreign export control regimes such as ITAR, without the
            necessary authorisation;
          </li>
          <li>
            Identifies individual service members, intelligence personnel, or their families
            in a manner that could expose them to personal risk, beyond what is already
            publicly attributed in the source under discussion.
          </li>
        </ul>
        <p>
          We reserve the right to remove such content immediately and without prior notice,
          to report credible threats to life or national security to the relevant
          authorities, and to suspend or terminate the account of a user who posts it,
          regardless of whether the content was assembled entirely from publicly available
          sources.
        </p>
        <p>
          This clause sets out a content policy and does not by itself determine what is or
          is not lawful under the Official Secrets Act, UK export control law, or related
          legislation. Users remain individually responsible for their own compliance with
          the law when posting.
        </p>

        <h2>7. Moderation</h2>
        <p>
          We reserve the right, but not the obligation, to review, moderate, edit, remove, or
          restrict visibility of any User Content, and to suspend or terminate accounts, at
          our sole discretion and without prior notice, where we consider content or conduct
          to violate these Terms, applicable law, or our editorial standards.
        </p>
        <p>
          We are not obliged to monitor the Forum on an ongoing basis. Where we become aware
          of content that may be unlawful (for example, through a user report or a legal
          notice), we will act on it in accordance with Section 8.
        </p>
        <p>
          Moderation decisions are made at our discretion and are not subject to a formal
          appeals process, save as described in Section 8 for infringement and illegality
          complaints.
        </p>

        <h2>8. Reporting and Notice and Takedown</h2>
        <p>
          Any user may report content they believe violates these Terms or applicable law
          using the in-Forum reporting tool or by emailing{' '}
          <a href="mailto:enquiries@advancedgrowinglabs.com">
            enquiries@advancedgrowinglabs.com
          </a>
          .
        </p>
        <p>
          If you believe content on the Forum is defamatory, infringes your intellectual
          property rights, or is otherwise unlawful, you may submit a complaint identifying
          the specific content, the URL or location, and the basis for the complaint. We
          will assess complaints and, where appropriate, remove or restrict access to the
          content expeditiously.
        </p>
        <p>
          Where a complaint concerns potentially defamatory content, we may, where
          practicable, seek to facilitate contact between the complainant and the poster, or
          provide information enabling identification of the poster in accordance with the
          process set out in the Defamation (Operators of Websites) Regulations 2013, rather
          than removing the content outright, unless the poster cannot be identified or does
          not respond within the applicable timeframe.
        </p>

        <h2>9. Intellectual Property of Fox and Lion</h2>
        <p>
          Except for User Content, all content on the Service, including text, graphics,
          logos, and the Fox and Lion name and marks, is owned by or licensed to Fox and Lion
          and is protected by intellectual property law. You may not reproduce, distribute,
          or create derivative works from Service content without our prior written consent,
          other than sharing links or standard social sharing of individual posts.
        </p>

        <h2>10. Disclaimers</h2>
        <p>
          The Forum is a space for user discussion and does not represent the editorial
          views of Fox and Lion. Views expressed by users are their own.
        </p>
        <p>
          The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;. To the
          fullest extent permitted by law, we disclaim all warranties, express or implied,
          regarding the accuracy, reliability, or availability of the Service or any User
          Content.
        </p>
        <p>
          Nothing in these Terms excludes or limits liability for death or personal injury
          caused by negligence, fraud, or any other liability that cannot be excluded or
          limited under applicable law.
        </p>

        <h2>11. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, Fox and Lion shall not be liable for any
          indirect, incidental, special, or consequential loss, or for loss of profits,
          revenue, data, or goodwill, arising from your use of the Forum or reliance on any
          User Content.
        </p>
        <p>
          Our total liability to you for any claim arising out of or relating to the Service
          shall not exceed £100.
        </p>

        <h2>12. Indemnification</h2>
        <p>
          You agree to indemnify and hold harmless Fox and Lion and the individuals operating
          it from any claims, losses, liabilities, and expenses (including reasonable legal
          fees) arising from your User Content, your breach of these Terms, or your
          violation of any law or third-party right.
        </p>

        <h2>13. Termination</h2>
        <p>
          You may stop using the Forum and delete your account at any time. We may suspend
          or terminate your access at our discretion, with or without notice, including for
          breach of these Terms.
        </p>
        <p>
          Sections relating to User Content licence, disclaimers, limitation of liability,
          indemnification, and governing law survive termination.
        </p>

        <h2>14. Changes to These Terms</h2>
        <p>
          We may update these Terms from time to time, particularly during the beta period.
          Material changes will be notified through the Forum or by email to registered
          users where practicable. Continued use of the Forum after changes take effect
          constitutes acceptance of the updated Terms.
        </p>

        <h2>15. Governing Law and Dispute Resolution</h2>
        <p>These Terms are governed by the laws of England and Wales.</p>
        <p>
          Before initiating formal proceedings, you agree to first raise any dispute with us
          informally by emailing{' '}
          <a href="mailto:enquiries@advancedgrowinglabs.com">
            enquiries@advancedgrowinglabs.com
          </a>{' '}
          and we will attempt to resolve it in good faith within 30 days.
        </p>
        <p>
          Subject to the paragraph above, any dispute that cannot be resolved informally
          shall be subject to the exclusive jurisdiction of the courts of England and Wales.
        </p>

        <h2>16. General Provisions</h2>
        <ul>
          <li>
            If any provision of these Terms is found unenforceable, the remaining provisions
            continue in effect.
          </li>
          <li>
            These Terms, together with our{' '}
            <Link href="/privacy-policy">Privacy Policy</Link> and Contributor Guidelines
            where applicable, constitute the entire agreement between you and Fox and Lion
            regarding the Forum.
          </li>
          <li>Our failure to enforce any right or provision is not a waiver of that right.</li>
          <li>
            You may not assign your rights under these Terms without our consent; we may
            assign these Terms in connection with a merger, acquisition, or sale of assets.
          </li>
        </ul>

        <h2>17. Contact</h2>
        <p>
          Questions about these Terms can be sent to{' '}
          <a href="mailto:enquiries@advancedgrowinglabs.com">
            enquiries@advancedgrowinglabs.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}
