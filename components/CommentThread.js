'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '../lib/supabase/client';
import Comment from './Comment';
import CommentComposer from './CommentComposer';

// Builds the nested tree from a flat list in O(n) via a Map keyed by id -
// this is exactly as cheap regardless of how deep threads go (see the plan
// notes on nesting depth), since it's the same shape of work whether the
// deepest thread is 1 level or 20.
function buildTree(rows) {
  const byId = new Map(rows.map((row) => [row.id, { ...row, replies: [] }]));
  const roots = [];
  for (const row of byId.values()) {
    if (row.parent_id && byId.has(row.parent_id)) {
      byId.get(row.parent_id).replies.push(row);
    } else {
      roots.push(row);
    }
  }
  return roots;
}

// Mounted once per News detail page (client-side, not read in the Server
// Component - same ISR-preserving reasoning as SiteHeader/PostEngagement).
// Fails soft to an empty list if the migrations in supabase/migrations
// haven't been applied yet, rather than breaking the page for everyone.
export default function CommentThread({ postUid }) {
  const [comments, setComments] = useState(null); // null = still loading
  const [profiles, setProfiles] = useState({});
  const [user, setUser] = useState(null);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function load() {
      const [{ data: rows, error: rowsError }, { data: userData }] = await Promise.all([
        supabase
          .from('news_post_comments')
          .select('*')
          .eq('post_uid', postUid)
          .order('created_at', { ascending: true }),
        supabase.auth.getUser(),
      ]);
      if (!active) return;

      if (rowsError) {
        setComments([]);
        setUser(userData?.user ?? null);
        return;
      }

      const userIds = [...new Set((rows || []).map((row) => row.user_id))];
      let profileMap = {};
      if (userIds.length > 0) {
        const { data: profileRows } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', userIds);
        profileMap = Object.fromEntries((profileRows || []).map((p) => [p.user_id, p]));
      }

      if (!active) return;
      setComments(rows || []);
      setProfiles(profileMap);
      setUser(userData?.user ?? null);
    }

    load().catch(() => {
      if (active) setComments((c) => c ?? []);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [postUid]);

  const tree = useMemo(() => buildTree(comments || []), [comments]);

  function addComment(row) {
    const { profile, ...rest } = row;
    if (profile) {
      setProfiles((prev) => ({ ...prev, [rest.user_id]: profile }));
    }
    setComments((prev) => [...(prev || []), rest]);
  }

  function handleEdited(updated) {
    setComments((prev) =>
      (prev || []).map((c) =>
        c.id === updated.id ? { ...c, body: updated.body, edited_at: updated.edited_at } : c
      )
    );
  }

  function handleRemoved(commentId) {
    setComments((prev) =>
      (prev || []).map((c) =>
        c.id === commentId ? { ...c, removed_at: new Date().toISOString() } : c
      )
    );
  }

  if (comments === null) {
    return <p className="comment-thread__loading">Loading comments…</p>;
  }

  return (
    <section className="comment-thread">
      <div className="comment-thread__header">
        <h2 className="comment-thread__heading">
          Comments{comments.length > 0 ? ` (${comments.length})` : ''}
        </h2>
        <p className="comment-thread__rules-link">
          Keep it on-topic and respectful — read the{' '}
          <Link href="/community-guidelines">Community Guidelines</Link>.
        </p>
      </div>

      {user ? (
        <CommentComposer postUid={postUid} onSubmitted={addComment} submitLabel="Comment" />
      ) : (
        <p className="comment-thread__sign-in-prompt">
          <Link href="/sign-in">Sign in</Link> to join the discussion.
        </p>
      )}

      {tree.length === 0 ? (
        <p className="comment-thread__empty">No comments yet — be the first to weigh in.</p>
      ) : (
        <div className="comment-thread__list">
          {tree.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              profiles={profiles}
              currentUserId={user?.id}
              postUid={postUid}
              onReplyPosted={addComment}
              onEdited={handleEdited}
              onRemoved={handleRemoved}
            />
          ))}
        </div>
      )}
    </section>
  );
}
