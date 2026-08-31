'use client';

import { useState } from 'react';
import Link from 'next/link';
import GoogleSignInButton from './GoogleSignInButton';

// Requires an affirmative, unchecked-by-default checkbox before enabling
// sign-in - same pattern SubmissionPortalForm already uses for its
// guideline checkboxes - rather than just a passive sentence under the
// button, since actually agreeing to something you comment under carries
// more weight than a claim nobody confirmed.
export default function SignInForm() {
  const [agreed, setAgreed] = useState(false);

  return (
    <div>
      <label className="submission-form__checkbox">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(event) => setAgreed(event.target.checked)}
        />
        <span>
          I agree to the{' '}
          <Link href="/terms" target="_blank" rel="noopener noreferrer">
            Terms &amp; Conditions
          </Link>{' '}
          and{' '}
          <Link href="/community-guidelines" target="_blank" rel="noopener noreferrer">
            Community Guidelines
          </Link>
          .
        </span>
      </label>
      <div style={{ marginTop: '1.25rem' }}>
        <GoogleSignInButton disabled={!agreed} />
      </div>
    </div>
  );
}
