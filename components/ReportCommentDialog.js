'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase/client';

const REASONS = [
  { value: 'spam', label: 'Spam or advertising' },
  { value: 'harassment', label: 'Harassment or personal attack' },
  { value: 'off_topic', label: 'Off-topic or not relevant' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'other', label: 'Other' },
];

// Inline report form shown under a comment (see Comment.js). Sign-in gate
// is deferred to submit time, same pattern as PostEngagement.handleVote and
// CommentComposer, rather than hiding the Report button for signed-out
// visitors.
export default function ReportCommentDialog({ commentId, onClose }) {
  const router = useRouter();
  const [reasonCode, setReasonCode] = useState(REASONS[0].value);
  const [detail, setDetail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | submitting | done | error

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus('submitting');

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push('/sign-in');
      return;
    }

    const { error } = await supabase.from('news_comment_reports').insert({
      comment_id: commentId,
      reporter_id: session.user.id,
      reason_code: reasonCode,
      detail: detail.trim() || null,
    });
    setStatus(error ? 'error' : 'done');
  }

  if (status === 'done') {
    return (
      <div className="report-dialog">
        <p className="report-dialog__thanks">Thanks — a moderator will review this.</p>
        <button type="button" className="report-dialog__cancel" onClick={onClose}>
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="report-dialog">
      <form onSubmit={handleSubmit} className="report-dialog__form">
        <label className="report-dialog__label">
          Reason
          <select value={reasonCode} onChange={(event) => setReasonCode(event.target.value)}>
            {REASONS.map((reason) => (
              <option key={reason.value} value={reason.value}>
                {reason.label}
              </option>
            ))}
          </select>
        </label>
        <textarea
          className="report-dialog__detail"
          placeholder="Add any additional context (optional)"
          value={detail}
          maxLength={500}
          rows={2}
          onChange={(event) => setDetail(event.target.value)}
        />
        <p className="report-dialog__guidelines-link">
          See our <Link href="/community-guidelines">Community Guidelines</Link>.
        </p>
        {status === 'error' && (
          <p className="report-dialog__error">
            Something went wrong — you may have already reported this comment.
          </p>
        )}
        <div className="report-dialog__actions">
          <button type="button" onClick={onClose} className="report-dialog__cancel">
            Cancel
          </button>
          <button type="submit" className="report-dialog__submit" disabled={status === 'submitting'}>
            {status === 'submitting' ? 'Submitting…' : 'Submit report'}
          </button>
        </div>
      </form>
    </div>
  );
}
