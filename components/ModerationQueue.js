'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '../lib/supabase/client';

const REASON_LABELS = {
  spam: 'Spam or advertising',
  harassment: 'Harassment or personal attack',
  off_topic: 'Off-topic or not relevant',
  misinformation: 'Misinformation',
  other: 'Other',
};

// Client-side so the Remove/Dismiss actions run under the moderator's own
// session (RLS + is_moderator() both check auth.uid()) - the initial list
// is server-fetched in page.js under the same session already, this just
// takes it from there. Profile lookup is a second client-side query, same
// reasoning as CommentThread: no FK exists between news_post_comments and
// profiles (both independently reference auth.users), so PostgREST can't
// auto-embed it.
export default function ModerationQueue({ initialReports }) {
  const [reports, setReports] = useState(initialReports);
  const [profiles, setProfiles] = useState({});
  const [pendingId, setPendingId] = useState(null);

  useEffect(() => {
    const userIds = [
      ...new Set(initialReports.map((r) => r.news_post_comments?.user_id).filter(Boolean)),
    ];
    if (userIds.length === 0) return;

    const supabase = createClient();
    supabase
      .from('profiles')
      .select('user_id, display_name')
      .in('user_id', userIds)
      .then(({ data }) => {
        setProfiles(Object.fromEntries((data || []).map((p) => [p.user_id, p])));
      });
  }, [initialReports]);

  async function handleAction(report, action) {
    if (pendingId) return;
    setPendingId(report.id);
    const supabase = createClient();

    if (action === 'remove') {
      await supabase.rpc('moderate_comment', { comment_id: report.comment_id, action: 'remove' });
    }

    await supabase
      .from('news_comment_reports')
      .update({
        status: action === 'remove' ? 'actioned' : 'dismissed',
        resolved_at: new Date().toISOString(),
      })
      .eq('id', report.id);

    setPendingId(null);
    setReports((prev) => prev.filter((r) => r.id !== report.id));
  }

  if (reports.length === 0) {
    return <p>No open reports.</p>;
  }

  return (
    <div className="moderation-queue">
      {reports.map((report) => {
        const comment = report.news_post_comments;
        const author = comment ? profiles[comment.user_id] : null;

        return (
          <div key={report.id} className="moderation-queue__item">
            <div className="moderation-queue__meta">
              <span className="moderation-queue__reason">
                {REASON_LABELS[report.reason_code] || report.reason_code}
              </span>
              {comment && (
                <Link href={`/news/${comment.post_uid}`} target="_blank" rel="noopener noreferrer">
                  View post &rarr;
                </Link>
              )}
            </div>

            {report.detail && (
              <p className="moderation-queue__detail">&ldquo;{report.detail}&rdquo;</p>
            )}

            <p className="moderation-queue__comment">
              <span className="moderation-queue__author">
                {author?.display_name || 'Unknown user'}:
              </span>{' '}
              {!comment ? (
                <em>[comment deleted]</em>
              ) : comment.removed_at ? (
                <em>[already removed]</em>
              ) : (
                comment.body
              )}
            </p>

            <div className="moderation-queue__actions">
              <button
                type="button"
                className="moderation-queue__remove"
                onClick={() => handleAction(report, 'remove')}
                disabled={pendingId === report.id || !comment || Boolean(comment.removed_at)}
              >
                Remove comment
              </button>
              <button
                type="button"
                className="moderation-queue__dismiss"
                onClick={() => handleAction(report, 'dismiss')}
                disabled={pendingId === report.id}
              >
                Dismiss report
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
