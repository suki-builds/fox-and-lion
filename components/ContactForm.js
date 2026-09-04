'use client';

import { useState } from 'react';

const MAX_MESSAGE_LENGTH = 1000;

export default function ContactForm() {
  const [fields, setFields] = useState({
    firstName: '',
    lastName: '',
    email: '',
    organisation: '',
    message: '',
  });
  // 'idle' | 'submitting' | 'success' | 'error'
  const [status, setStatus] = useState('idle');

  const messageLength = fields.message.length;
  const allFilled = Object.values(fields).every((value) => value.trim() !== '');
  const withinLimit = messageLength <= MAX_MESSAGE_LENGTH;

  function updateField(name) {
    return (event) => setFields((prev) => ({ ...prev, [name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus('submitting');
    try {
      const res = await fetch('/api/submit-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
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
          <label htmlFor="organisation">
            Organisation <span className="submission-form__required">*</span>
          </label>
          <input
            id="organisation"
            type="text"
            required
            value={fields.organisation}
            onChange={updateField('organisation')}
          />
        </div>

        <div className="submission-form__field">
          <label htmlFor="message">
            Message <span className="submission-form__required">*</span>
          </label>
          <textarea
            id="message"
            rows={8}
            required
            maxLength={MAX_MESSAGE_LENGTH}
            value={fields.message}
            onChange={updateField('message')}
          />
          <div className="submission-form__field-footer">
            <span
              className={`submission-form__counter${!withinLimit ? ' is-over' : ''}`}
            >
              {messageLength} / {MAX_MESSAGE_LENGTH.toLocaleString()} characters
            </span>
          </div>
        </div>
      </section>

      <div className="submission-form__submit-row">
        <button
          type="submit"
          className="submission-form__submit"
          disabled={
            !allFilled || !withinLimit || status === 'submitting' || status === 'success'
          }
        >
          {status === 'submitting' ? 'Sending…' : 'Send Message'}
        </button>
        <p className="submission-form__privacy-note">
          Your details are used only to respond to your message and won&rsquo;t be shared
          beyond the Fox and Lion team. See our{' '}
          <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </a>
          .
        </p>
        {status === 'success' && (
          <p className="submission-form__status-note is-success">
            Thanks &mdash; we&rsquo;ve received your message and will be in touch.
          </p>
        )}
        {status === 'error' && (
          <p className="submission-form__status-note is-error">
            Something went wrong sending your message. Please try again, or email us
            directly at{' '}
            <a href="mailto:foxandlion@advancedgrowinglabs.com">
              foxandlion@advancedgrowinglabs.com
            </a>{' '}
            if the problem persists.
          </p>
        )}
      </div>
    </form>
  );
}
