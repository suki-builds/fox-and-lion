'use client';

import { useState } from 'react';

const REQUIRED_KEYS = ['firstName', 'lastName', 'email', 'resumeUrl'];

export default function JobApplicationForm({ careersPostUid, jobTitle, companyName }) {
  const [fields, setFields] = useState({
    firstName: '',
    lastName: '',
    email: '',
    linkedinUrl: '',
    resumeUrl: '',
    coverNote: '',
  });
  // 'idle' | 'submitting' | 'success' | 'error'
  const [status, setStatus] = useState('idle');

  const requiredFilled = REQUIRED_KEYS.every((key) => fields[key].trim() !== '');

  function updateField(name) {
    return (event) => setFields((prev) => ({ ...prev, [name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus('submitting');
    try {
      const res = await fetch('/api/submit-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ careersPostUid, jobTitle, companyName, ...fields }),
      });
      if (!res.ok) throw new Error('Submission failed');
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  return (
    <form className="submission-form" onSubmit={handleSubmit}>
      <section className="submission-form__section">
        <div className="submission-form__row">
          <div className="submission-form__field">
            <label htmlFor="firstName">
              First Name <span className="submission-form__required">*</span>
            </label>
            <input
              id="firstName"
              type="text"
              required
              value={fields.firstName}
              onChange={updateField('firstName')}
            />
          </div>
          <div className="submission-form__field">
            <label htmlFor="lastName">
              Last Name <span className="submission-form__required">*</span>
            </label>
            <input
              id="lastName"
              type="text"
              required
              value={fields.lastName}
              onChange={updateField('lastName')}
            />
          </div>
        </div>

        <div className="submission-form__field">
          <label htmlFor="email">
            Email <span className="submission-form__required">*</span>
          </label>
          <input
            id="email"
            type="email"
            required
            value={fields.email}
            onChange={updateField('email')}
          />
        </div>

        <div className="submission-form__field">
          <label htmlFor="linkedinUrl">LinkedIn / Portfolio URL</label>
          <input
            id="linkedinUrl"
            type="url"
            placeholder="https://"
            value={fields.linkedinUrl}
            onChange={updateField('linkedinUrl')}
          />
        </div>

        <div className="submission-form__field">
          <label htmlFor="resumeUrl">
            Resume / CV Link <span className="submission-form__required">*</span>
          </label>
          <input
            id="resumeUrl"
            type="url"
            required
            placeholder="https://"
            value={fields.resumeUrl}
            onChange={updateField('resumeUrl')}
          />
          <p className="submission-form__help">
            A link to your CV/résumé &mdash; Google Drive, Dropbox, or a personal site all
            work, as long as it&rsquo;s viewable without requesting access.
          </p>
        </div>

        <div className="submission-form__field">
          <label htmlFor="coverNote">Why you&rsquo;re a fit</label>
          <textarea
            id="coverNote"
            rows={6}
            value={fields.coverNote}
            onChange={updateField('coverNote')}
          />
        </div>
      </section>

      <div className="submission-form__submit-row">
        <button
          type="submit"
          className="submission-form__submit"
          disabled={!requiredFilled || status === 'submitting' || status === 'success'}
        >
          {status === 'submitting' ? 'Submitting…' : 'Submit Application'}
        </button>
        <p className="submission-form__privacy-note">
          Your details are shared with Fox and Lion and {companyName} for the purpose of
          reviewing this application, and won&rsquo;t be used for anything else. See our{' '}
          <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </a>
          .
        </p>
        {status === 'success' && (
          <p className="submission-form__status-note is-success">
            Thanks &mdash; we&rsquo;ve received your application for {jobTitle} and will be
            in touch if it&rsquo;s a fit.
          </p>
        )}
        {status === 'error' && (
          <p className="submission-form__status-note is-error">
            Something went wrong submitting your application. Please try again in a moment,
            or reach us via our{' '}
            <a href="/contact" target="_blank" rel="noopener noreferrer">
              Contact page
            </a>{' '}
            if the problem persists.
          </p>
        )}
      </div>
    </form>
  );
}
