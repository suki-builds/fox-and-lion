import { NextResponse } from 'next/server';
import { createPitchSubmission } from '../../../lib/formsSupabase';

const REQUIRED_FIELDS = ['firstName', 'lastName', 'email', 'bio', 'pitch'];

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const missing = REQUIRED_FIELDS.filter((field) => !body?.[field]?.trim());
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required field(s): ${missing.join(', ')}.` },
      { status: 400 }
    );
  }

  try {
    await createPitchSubmission({
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      email: body.email.trim(),
      bio: body.bio.trim(),
      pitch: body.pitch.trim(),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    // Logged server-side for diagnosis; the client only ever sees a
    // generic message (see SubmissionPortalForm's error copy) - no
    // internal error detail or stack gets sent to the submitter.
    console.error('Pitch submission failed:', err);
    return NextResponse.json({ error: 'Failed to submit pitch.' }, { status: 502 });
  }
}
