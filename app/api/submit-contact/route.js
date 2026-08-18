import { NextResponse } from 'next/server';
import { createContactMessage } from '../../../lib/datocmsCma';

const REQUIRED_FIELDS = ['firstName', 'lastName', 'email', 'organisation', 'message'];
const MAX_MESSAGE_LENGTH = 1000;

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

  if (body.message.trim().length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Message exceeds ${MAX_MESSAGE_LENGTH} characters.` },
      { status: 400 }
    );
  }

  try {
    await createContactMessage({
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      email: body.email.trim(),
      organisation: body.organisation.trim(),
      message: body.message.trim(),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    // Logged server-side for diagnosis; the client only ever sees a
    // generic message (see ContactForm's error copy) - no internal error
    // detail or stack gets sent to the submitter.
    console.error('Contact message submission failed:', err);
    return NextResponse.json({ error: 'Failed to submit message.' }, { status: 502 });
  }
}
