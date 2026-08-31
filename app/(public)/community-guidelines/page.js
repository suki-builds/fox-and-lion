export const metadata = {
  title: 'Community Guidelines — Fox and Lion',
};

// Static page (not pulled from Prismic), same as submission-guidelines -
// edit this file directly when the rules change. Adapted from the team's
// existing subreddit rules, trimmed to what applies to a comments-only
// section: "Use Flair Correctly" and "No Paywalls" don't carry over, since
// there's no user post-submission format here (News items are curated, not
// user-submitted).
export default function CommunityGuidelinesPage() {
  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '3rem' }}>
      <h1>Community Guidelines</h1>

      <div className="article-body">
        <p>
          These guidelines apply to comments left on Fox and Lion. We want this to be a
          space worth reading — for that, we need it to stay civil and on-topic.
          Moderators may remove comments or restrict accounts that break these rules.
        </p>

        <h2>1. Be Respectful</h2>
        <p>
          No harassment, personal attacks, slurs, or toxic behaviour. Keep things
          constructive, especially during heated debates. We have a zero-tolerance policy
          for violations of this rule.
        </p>

        <h2>2. Be Relevant</h2>
        <p>
          Comments must be substantially related to defence technology and the United
          Kingdom. Comments which are not, or are only tangentially related, may be
          removed. We have a zero-tolerance policy for violations of this rule.
        </p>

        <h2>3. No Politics</h2>
        <p>
          No political discussions. We are not a political forum. Make sure your comment
          adds value to the community. We have a zero-tolerance policy for violations of
          this rule.
        </p>

        <h2>4. No Self-Promotion or Advertising</h2>
        <p>
          No links to your own YouTube channel, Substack, or company unless approved by
          moderators.
        </p>

        <h2>5. No Misinformation or Clickbait</h2>
        <p>
          Don&rsquo;t state rumours or theories as fact — clearly label them as such.
          Sources must be credible (government announcements, official statements,
          credible news agencies, and the like).
        </p>
      </div>
    </div>
  );
}
