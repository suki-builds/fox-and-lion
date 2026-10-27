import { NextResponse } from 'next/server';
import { createNewsletterSubscriber } from '../../../lib/formsSupabase';

// Deliberately loose - the browser's type="email" check does the real
// work; this just stops obvious junk reaching the table from direct POSTs.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  try {
    await createNewsletterSubscriber(email);
    return NextResponse.json({ ok: true });
  } catch (err) {
    // err.message only, same as the other form routes - nothing internal
    // goes back to the client.
    console.error('Newsletter sign-up failed:', err.message);
    return NextResponse.json({ error: 'Failed to sign up.' }, { status: 502 });
  }
}
