import { NextResponse } from 'next/server';
import { createJobApplication } from '../../../lib/formsSupabase';

const REQUIRED_FIELDS = [
  'careersPostUid',
  'jobTitle',
  'companyName',
  'firstName',
  'lastName',
  'email',
  'resumeUrl',
];

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
    await createJobApplication({
      careersPostUid: body.careersPostUid.trim(),
      jobTitle: body.jobTitle.trim(),
      companyName: body.companyName.trim(),
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      email: body.email.trim(),
      linkedinUrl: body.linkedinUrl?.trim(),
      resumeUrl: body.resumeUrl.trim(),
      coverNote: body.coverNote?.trim(),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    // Logged server-side for diagnosis; the client only ever sees a
    // generic message (see JobApplicationForm's error copy) - no internal
    // error detail or stack gets sent to the applicant.
    console.error('Job application submission failed:', err);
    return NextResponse.json({ error: 'Failed to submit application.' }, { status: 502 });
  }
}
