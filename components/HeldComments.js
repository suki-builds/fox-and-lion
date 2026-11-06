'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '../lib/supabase/client';

const FLAG_LABELS = {
  profanity: 'Profanity',
  link: 'Contains a link',
  repetition: 'Repeated characters',
  shouting: 'Mostly capitals',
};

// Guest comments the filters held back (see app/api/guest-comment/route.js).
// A held comment is stored as removed, with removed_reason 'held for review',
// so approving and rejecting are the existing moderate_comment() actions:
// 'restore' publishes it, 'remove' turns it into an ordinary removed comment.
// Same error handling as ModerationQueue - a failed call keeps the comment
// in the list and says so, rather than looking handled.
export default function HeldComments({ initialComments }) {
  const [comments, setComments] = useState(initialComments);
  const [pendingId, setPendingId] = useState(null);
  const [errors, setErrors] = useState({});

  async function handle(comment, action) {
    if (pendingId) return;
    setPendingId(comment.id);
    setErrors((prev) => ({ ...prev, [comment.id]: null }));

    const supabase = createClient();
    const { error } = await supabase.rpc('moderate_comment', {
      comment_id: comment.id,
      action: action === 'approve' ? 'restore' : 'remove',
    });

    if (error) {
      setErrors((prev) => ({ ...prev, [comment.id]: error.message }));
    } else {
      setComments((prev) => prev.filter((c) => c.id !== comment.id));
    }
    setPendingId(null);
  }

  if (comments.length === 0) {
    return <p>Nothing held for review.</p>;
  }

  return (
    <div className="moderation-queue">
      {comments.map((comment) => {
        // One-to-one embed - PostgREST returns an object, but accept an
        // array too in case it ever can't tell.
        const meta = Array.isArray(comment.news_comment_guest_meta)
          ? comment.news_comment_guest_meta[0]
          : comment.news_comment_guest_meta;
        const reasons = meta?.flag_reasons || [];

        return (
          <div key={comment.id} className="moderation-queue__item">
            <div className="moderation-queue__meta">
              <span className="moderation-queue__reason">
                {reasons.map((r) => FLAG_LABELS[r] || r).join(', ') || 'Held'}
              </span>
              <Link
                prefetch={false}
                href={`${comment.post_type === 'analysis' ? '/analysis' : '/news'}/${comment.post_uid}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View post &rarr;
              </Link>
            </div>

            <p className="moderation-queue__comment">
              <span className="moderation-queue__author">{comment.guest_name} (guest):</span>{' '}
              {comment.body}
            </p>

            <div className="moderation-queue__actions">
              <button
                type="button"
                className="moderation-queue__dismiss"
                onClick={() => handle(comment, 'approve')}
                disabled={pendingId === comment.id}
              >
                Approve
              </button>
              <button
                type="button"
                className="moderation-queue__remove"
                onClick={() => handle(comment, 'reject')}
                disabled={pendingId === comment.id}
              >
                Reject
              </button>
            </div>

            {errors[comment.id] && (
              <p className="moderation-queue__error" role="alert">
                {errors[comment.id]} &mdash; the comment is still held.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
