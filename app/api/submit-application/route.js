import { NextResponse } from 'next/server';
import { createJobApplication, uploadResume } from '../../../lib/formsSupabase';

const REQUIRED_TEXT_FIELDS = [
  'careersPostUid',
  'jobTitle',
  'companyName',
  'firstName',
  'lastName',
  'email',
];

const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const ALLOWED_RESUME_EXTENSIONS = ['pdf', 'doc', 'docx'];

export async function POST(request) {
  let formData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const fields = Object.fromEntries(
    REQUIRED_TEXT_FIELDS.concat(['linkedinUrl', 'coverNote']).map((key) => [
      key,
      formData.get(key)?.toString().trim() || '',
    ])
  );

  const missing = REQUIRED_TEXT_FIELDS.filter((field) => !fields[field]);
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required field(s): ${missing.join(', ')}.` },
      { status: 400 }
    );
  }

  const resumeFile = formData.get('resume');
  if (!(resumeFile instanceof File) || resumeFile.size === 0) {
    return NextResponse.json({ error: 'A resume/CV file is required.' }, { status: 400 });
  }
  if (resumeFile.size > MAX_RESUME_BYTES) {
    return NextResponse.json({ error: 'Resume file is too large (max 5MB).' }, { status: 400 });
  }
  const extension = resumeFile.name.split('.').pop()?.toLowerCase();
  if (!extension || !ALLOWED_RESUME_EXTENSIONS.includes(extension)) {
    return NextResponse.json(
      { error: 'Resume must be a PDF or Word document (.pdf, .doc, .docx).' },
      { status: 400 }
    );
  }

  try {
    const resumePath = await uploadResume(resumeFile, {
      firstName: fields.firstName,
      lastName: fields.lastName,
    });
    await createJobApplication({ ...fields, resumePath });
    return NextResponse.json({ ok: true });
  } catch (err) {
    // Logged server-side for diagnosis; the client only ever sees a
    // generic message (see JobApplicationForm's error copy) - no internal
    // error detail or stack gets sent to the applicant.
    console.error('Job application submission failed:', err);
    return NextResponse.json({ error: 'Failed to submit application.' }, { status: 502 });
  }
}
