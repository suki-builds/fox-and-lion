'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase/client';

const MAX_LENGTH = 2000;

// Shared textarea+submit for posting a new top-level comment, replying to
// one (parentId set), or editing an existing one (commentId set) - which
// mode depends on which props are passed. Sign-in gate mirrors
// PostEngagement.handleVote: bounce anonymous visitors to /sign-in rather
// than letting them type into a form that will just fail against RLS.
export default function CommentComposer({
  postUid,
  parentId = null,
  commentId = null,
  initialBody = '',
  placeholder = 'Add a comment…',
  submitLabel = 'Post',
  onSubmitted,
  onCancel,
  autoFocus = false,
}) {
  const router = useRouter();
  const [body, setBody] = useState(initialBody);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const isEdit = Boolean(commentId);

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || submitting) return;

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
        {error ? <span className="comment-composer__error">{error}</span> : <span />}
        <div className="comment-composer__actions">
          {onCancel && (
            <button type="button" className="comment-composer__cancel" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="comment-composer__submit"
            disabled={submitting || !body.trim()}
          >
            {submitting ? 'Posting…' : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
