'use client';

import { useState } from 'react';
import { createClient } from '../lib/supabase/client';
import CommentComposer from './CommentComposer';
import ReportCommentDialog from './ReportCommentDialog';

// Threading is hard-capped at 5 levels (depth 0..4) server-side - see
// set_and_check_comment_depth() in supabase/migrations/0004_news_comments.sql.
// This just hides the Reply action once a comment is already at the cap, so
// nobody is offered an action that would just error.
const MAX_DEPTH = 4;

function formatTimestamp(iso) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Recursive: renders one comment plus its replies. Depth-based indentation
// is applied per-comment via the --comment-depth custom property (absolute,
// not compounding), so nesting looks right regardless of how deep the
// recursion goes.
export default function Comment({
  comment,
  profiles,
  currentUserId,
  postUid,
  postType = 'news',
  archived = false,
  onReplyPosted,
  onEdited,
  onRemoved,
}) {
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [removing, setRemoving] = useState(false);

  const profile = profiles[comment.user_id];
  const isOwn = currentUserId && currentUserId === comment.user_id;
  const isRemoved = Boolean(comment.removed_at);
  // No new replies once a post is archived - editing/deleting/reporting an
  // existing comment is still allowed, since that's cleanup of your own
  // content rather than new engagement with an archived thread.
  const canReply = comment.depth < MAX_DEPTH && !archived;

  async function handleDelete() {
    if (removing || !window.confirm('Delete this comment?')) return;
    setRemoving(true);
    const supabase = createClient();
    const { error } = await supabase.rpc('delete_own_comment', { comment_id: comment.id });
    setRemoving(false);
    if (!error) onRemoved(comment.id);
  }

  return (
    <div className="comment" style={{ '--comment-depth': comment.depth }}>
      <div className="comment__row">
        {!isRemoved && profile?.avatar_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt=""
            className="comment__avatar"
            referrerPolicy="no-referrer"
          />
        )}
        <div className="comment__body">
          <div className="comment__meta">
            {!isRemoved && (
              <span className="comment__author">
                {profile?.username || 'Fox and Lion reader'}
              </span>
            )}
            <span className="comment__timestamp">{formatTimestamp(comment.created_at)}</span>
            {comment.edited_at && !isRemoved && <span className="comment__edited">(edited)</span>}
          </div>

          {isRemoved ? (
            <p className="comment__text comment__text--removed">
              [{comment.removed_reason === 'deleted by author'
                ? 'deleted by author'
                : 'removed by moderator'}]
            </p>
          ) : editing ? (
            <CommentComposer
              postUid={postUid}
              postType={postType}
              commentId={comment.id}
              initialBody={comment.body}
              submitLabel="Save"
              autoFocus
              onCancel={() => setEditing(false)}
              onSubmitted={(updated) => {
                onEdited(updated);
                setEditing(false);
              }}
            />
          ) : (
            <p className="comment__text">{comment.body}</p>
          )}

          {!isRemoved && !editing && (
            <div className="comment__actions">
              {canReply && (
                <button
                  type="button"
                  className="comment__action"
                  onClick={() => setReplying((r) => !r)}
                >
                  Reply
                </button>
              )}
              {isOwn && (
                <>
                  <button type="button" className="comment__action" onClick={() => setEditing(true)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="comment__action"
                    onClick={handleDelete}
                    disabled={removing}
                  >
                    Delete
                  </button>
                </>
              )}
              {!isOwn && (
                <button
                  type="button"
                  className="comment__action"
                  onClick={() => setReporting((r) => !r)}
                >
                  Report
                </button>
              )}
            </div>
          )}

          {replying && (
            <CommentComposer
              postUid={postUid}
              postType={postType}
              parentId={comment.id}
              placeholder="Write a reply…"
              submitLabel="Reply"
              autoFocus
              onCancel={() => setReplying(false)}
              onSubmitted={(row) => {
                onReplyPosted(row);
                setReplying(false);
              }}
            />
          )}

          {reporting && (
            <ReportCommentDialog commentId={comment.id} onClose={() => setReporting(false)} />
          )}
        </div>
      </div>

      {comment.replies.length > 0 && (
        <div className="comment__replies">
          {comment.replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              profiles={profiles}
              currentUserId={currentUserId}
              postUid={postUid}
              postType={postType}
              archived={archived}
              onReplyPosted={onReplyPosted}
              onEdited={onEdited}
              onRemoved={onRemoved}
            />
          ))}
        </div>
      )}
    </div>
  );
}
