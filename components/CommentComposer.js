'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase/client';

const MAX_LENGTH = 2000;
const HELD_MESSAGE = 'Thanks - your comment will appear once a moderator has reviewed it.';

// Shared textarea+submit for posting a new top-level comment, replying to
// one (parentId set), or editing an existing one (commentId set) - which
// mode depends on which props are passed.
//
// `guest` is for visitors who aren't signed in: it adds a name field and
// posts through /api/guest-comment, which filters the comment and may hold
// it for review. A signed-in composer whose session has gone missing still
// bounces to /sign-in, same as PostEngagement.handleVote.
export default function CommentComposer({
  postUid,
  postType = 'news',
  parentId = null,
  commentId = null,
  initialBody = '',
  placeholder = 'Add a comment…',
  submitLabel = 'Post',
  onSubmitted,
  onCancel,
  autoFocus = false,
  guest = false,
}) {
  const router = useRouter();
  const [body, setBody] = useState(initialBody);
  const [name, setName] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  // When the form appeared - the guest route refuses anything submitted
  // faster than a person could plausibly type it.
  const openedAt = useRef(Date.now());
  const isEdit = Boolean(commentId);

  async function submitAsGuest(trimmed) {
    const res = await fetch('/api/guest-comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postUid,
        postType,
        parentId,
        name: name.trim(),
        body: trimmed,
        website: honeypot,
        elapsedMs: Date.now() - openedAt.current,
      }),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(result.error || 'Something went wrong. Please try again.');

    setBody('');
    if (result.status === 'published' && result.comment) {
      onSubmitted?.(result.comment);
    } else {
      setNotice(HELD_MESSAGE);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || submitting) return;

    if (guest) {
      setSubmitting(true);
      setError(null);
      setNotice(null);
      try {
        await submitAsGuest(trimmed);
      } catch (err) {
        setError(err.message);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push('/sign-in');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      if (isEdit) {
        const { error: rpcError } = await supabase.rpc('edit_own_comment', {
          comment_id: commentId,
          new_body: trimmed,
        });
        if (rpcError) throw rpcError;
        onSubmitted?.({ id: commentId, body: trimmed, edited_at: new Date().toISOString() });
      } else {
        const { data, error: insertError } = await supabase
          .from('news_post_comments')
          .insert({
            post_uid: postUid,
            post_type: postType,
            parent_id: parentId,
            user_id: session.user.id,
            body: trimmed,
          })
          .select()
          .single();
        if (insertError) throw insertError;
        setBody('');
        onSubmitted?.(data);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="comment-composer" onSubmit={handleSubmit}>
      {guest && (
        <div className="comment-composer__guest">
          <input
            type="text"
            className="comment-composer__name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            aria-label="Your name"
            minLength={2}
            maxLength={40}
            autoComplete="name"
            required
          />
          <span className="comment-composer__guest-hint">
            Posting as a guest, or <Link prefetch={false} href="/sign-in">sign in</Link>
          </span>
          {/* Honeypot: hidden from people and screen readers, filled in by bots. */}
          <input
            type="text"
            name="website"
            className="comment-composer__honeypot"
            value={honeypot}
            onChange={(event) => setHoneypot(event.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />
        </div>
      )}
      <textarea
        className="comment-composer__textarea"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder={placeholder}
        maxLength={MAX_LENGTH}
        rows={isEdit ? 3 : 2}
        autoFocus={autoFocus}
        required
      />
      <div className="comment-composer__footer">
        {error ? (
          <span className="comment-composer__error">{error}</span>
        ) : notice ? (
          <span className="comment-composer__notice" role="status">{notice}</span>
        ) : (
          <span />
        )}
        <div className="comment-composer__actions">
          {onCancel && (
            <button type="button" className="comment-composer__cancel" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="comment-composer__submit"
            disabled={submitting || !body.trim() || (guest && name.trim().length < 2)}
          >
            {submitting ? 'Posting…' : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
