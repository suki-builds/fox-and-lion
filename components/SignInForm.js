'use client';

import { useState } from 'react';
import Link from 'next/link';
import GoogleSignInButton from './GoogleSignInButton';

// Requires two affirmative, unchecked-by-default checkboxes before enabling
// sign-in - same pattern SubmissionPortalForm already uses for its
// guideline checkboxes - rather than just a passive sentence under the
// button, since actually agreeing to something you comment under carries
// more weight than a claim nobody confirmed. The OPSEC checkbox is separate
// from the Terms/Guidelines one since it's a distinct, substantive
// commitment (see Section 6 of the Terms of Service), not just boilerplate.
export default function SignInForm() {
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedOpsec, setAgreedOpsec] = useState(false);

  return (
    <div>
      <label className="submission-form__checkbox">
        <input
          type="checkbox"
          checked={agreedTerms}
          onChange={(event) => setAgreedTerms(event.target.checked)}
        />
        <span>
          I agree to the{' '}
          <Link href="/terms-of-service" target="_blank" rel="noopener noreferrer">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/community-guidelines" target="_blank" rel="noopener noreferrer">
            Community Guidelines
          </Link>
          .
        </span>
      </label>

      <label className="submission-form__checkbox" style={{ marginTop: '0.85rem' }}>
        <input
          type="checkbox"
          checked={agreedOpsec}
          onChange={(event) => setAgreedOpsec(event.target.checked)}
        />
        <span>
          I agree to the OPSEC requirements in the{' '}
          <Link href="/terms-of-service#opsec" target="_blank" rel="noopener noreferrer">
            Terms of Service
          </Link>{' '}
          and will not post classified, restricted, or operationally sensitive information.
          <br />
          <span style={{ fontSize: '0.82em', color: 'var(--color-text-muted)' }}>
            This includes real-time locations or movements of military personnel and assets,
            and open-source information compiled in a way that creates a greater security
            risk than the individual pieces alone.
          </span>
        </span>
      </label>

      <div style={{ marginTop: '1.25rem' }}>
        <GoogleSignInButton disabled={!agreedTerms || !agreedOpsec} />
      </div>
    </div>
  );
}
