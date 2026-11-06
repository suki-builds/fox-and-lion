import { createHmac } from 'crypto';
import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../lib/supabase/admin';
import { BODY_MAX, checkGuestName, flagReasons } from '../../../lib/guestCommentFilters';

// Posts a comment for a visitor who isn't signed in. Clean comments appear
// straight away; anything the filters flag is held until a moderator
// approves it on /moderation. See supabase/migrations/0026_guest_comments.sql.
//
// Bots are turned away before the database is touched:
//   - `website` is a honeypot field, hidden from people but filled in by
//     form-filling bots;
//   - `elapsedMs` is how long the form was open, and nobody reads an
//     article and writes a comment in under three seconds.
// Both answer "held" as if the comment went through, so a bot learns
// nothing from the response.
const MIN_ELAPSED_MS = 3000;
const POST_TYPES = ['news', 'analysis'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The rate limit is per IP, but only a keyed hash of it is stored. The key
// is the service-role key, which is already a server-only secret, so the
// hash can't be reversed by trying every IP address.
function hashClientKey(request) {
  const ip =
    request.headers.get('x-real-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || 'unknown';
  return createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY || '')
    .update(ip)
    .digest('hex');
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (body?.website || !(Number(body?.elapsedMs) >= MIN_ELAPSED_MS)) {
    return NextResponse.json({ status: 'held' });
  }

  const name = String(body.name || '').trim();
  const text = String(body.body || '').trim();
  const postUid = String(body.postUid || '');
  const postType = String(body.postType || '');
  const parentId = body.parentId ? String(body.parentId) : null;

  if (!postUid || !POST_TYPES.includes(postType) || (parentId && !UUID.test(parentId))) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  if (!text || text.length > BODY_MAX) {
    return NextResponse.json(
      { error: `Comments must be between 1 and ${BODY_MAX} characters.` },
      { status: 400 }
    );
  }
  const nameError = checkGuestName(name);
  if (nameError) {
    return NextResponse.json({ error: nameError }, { status: 400 });
  }

  const reasons = flagReasons(text);

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc('insert_guest_comment', {
      p_post_uid: postUid,
      p_post_type: postType,
      p_parent_id: parentId,
      p_guest_name: name,
      p_body: text,
      p_key_hash: hashClientKey(request),
      p_flag_reasons: reasons,
    });

    if (error) {
      if (/too quickly/.test(error.message)) {
        return NextResponse.json({ error: error.message }, { status: 429 });
      }
      if (/threading is capped|does not exist/.test(error.message)) {
        return NextResponse.json({ error: 'You can’t reply to that comment.' }, { status: 400 });
      }
      throw error;
    }

    if (reasons.length > 0) {
      return NextResponse.json({ status: 'held' });
    }
    return NextResponse.json({ status: 'published', comment: data });
  } catch (err) {
    console.error('Guest comment failed:', err?.message || err);
    return NextResponse.json(
      { error: 'Your comment couldn’t be posted. Please try again.' },
      { status: 502 }
    );
  }
}
