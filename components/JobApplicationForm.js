'use client';

import { useState } from 'react';

const REQUIRED_TEXT_KEYS = ['firstName', 'lastName', 'email'];
const MAX_RESUME_BYTES = 5 * 1024 * 1024;

export default function JobApplicationForm({ careersPostUid, jobTitle, companyName }) {
  const [fields, setFields] = useState({
    firstName: '',
    lastName: '',
    email: '',
    linkedinUrl: '',
    coverNote: '',
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [fileError, setFileError] = useState('');
  // 'idle' | 'submitting' | 'success' | 'error'
  const [status, setStatus] = useState('idle');

  const requiredFilled =
    REQUIRED_TEXT_KEYS.every((key) => fields[key].trim() !== '') && resumeFile !== null;

  function updateField(name) {
    return (event) => setFields((prev) => ({ ...prev, [name]: event.target.value }));
  }

  function updateResumeFile(event) {
    const file = event.target.files?.[0] || null;
    if (file && file.size > MAX_RESUME_BYTES) {
      setFileError('File is too large — max 5MB.');
      setResumeFile(null);
      event.target.value = '';
      return;
    }
    setFileError('');
    setResumeFile(file);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus('submitting');
    try {
      const body = new FormData();
      body.append('careersPostUid', careersPostUid);
      body.append('jobTitle', jobTitle);
      body.append('companyName', companyName);
      Object.entries(fields).forEach(([key, value]) => body.append(key, value));
      body.append('resume', resumeFile);

      // No Content-Type header here — the browser sets the multipart
      // boundary itself; setting it manually breaks the upload.
      const res = await fetch('/api/submit-application', { method: 'POST', body });
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
          <label htmlFor="resumeFile">
            Resume / CV <span className="submission-form__required">*</span>
          </label>
          <input
            id="resumeFile"
            type="file"
            required
            accept=".pdf,.doc,.docx"
            onChange={updateResumeFile}
          />
          <p className="submission-form__help">PDF or Word document, up to 5MB.</p>
          {fileError && <p className="submission-form__status-note is-error">{fileError}</p>}
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
