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

const BAN_DURATIONS = [
  { value: '1', label: '1 day' },
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: 'permanent', label: 'Permanently' },
];

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
  const [banDurations, setBanDurations] = useState({});

  useEffect(() => {
    const userIds = [
      ...new Set(initialReports.map((r) => r.news_post_comments?.user_id).filter(Boolean)),
    ];
    if (userIds.length === 0) return;

    const supabase = createClient();
    supabase
      .from('profiles')
      .select('user_id, username')
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

  // Bans the comment's author and removes the comment in one step - a
  // moderator reaching for "ban" already wants the offending content gone
  // too. Unlike handleAction('remove'), this always has a target user, so
  // it's kept separate rather than folded into the same function.
  async function handleBan(report) {
    const comment = report.news_post_comments;
    if (pendingId || !comment) return;
    setPendingId(report.id);
    const supabase = createClient();

    const durationValue = banDurations[report.id] || BAN_DURATIONS[1].value;
    const durationDays = durationValue === 'permanent' ? null : Number(durationValue);

    await supabase.rpc('ban_user', {
      target_user_id: comment.user_id,
      duration_days: durationDays,
    });
    await supabase.rpc('moderate_comment', { comment_id: report.comment_id, action: 'remove' });
    await supabase
      .from('news_comment_reports')
      .update({ status: 'actioned', resolved_at: new Date().toISOString() })
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
                <Link
                  href={`${comment.post_type === 'analysis' ? '/analysis' : '/news'}/${comment.post_uid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View post &rarr;
                </Link>
              )}
            </div>

            {report.detail && (
              <p className="moderation-queue__detail">&ldquo;{report.detail}&rdquo;</p>
            )}

            <p className="moderation-queue__comment">
              <span className="moderation-queue__author">
                {author?.username || 'Unknown user'}:
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
              <select
                className="moderation-queue__ban-duration"
                value={banDurations[report.id] || BAN_DURATIONS[1].value}
                onChange={(event) =>
                  setBanDurations((prev) => ({ ...prev, [report.id]: event.target.value }))
                }
                disabled={pendingId === report.id || !comment}
              >
                {BAN_DURATIONS.map((duration) => (
                  <option key={duration.value} value={duration.value}>
                    {duration.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="moderation-queue__ban"
                onClick={() => handleBan(report)}
                disabled={pendingId === report.id || !comment}
              >
                Ban &amp; remove
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
