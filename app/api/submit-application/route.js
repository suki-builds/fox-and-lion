import { NextResponse } from 'next/server';
import { createJobApplication, uploadResume, uploadAdditionalFiles } from '../../../lib/formsSupabase';

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

const MAX_ADDITIONAL_FILES = 5;
const MAX_ADDITIONAL_TOTAL_BYTES = 20 * 1024 * 1024;
const ALLOWED_ADDITIONAL_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'zip', 'txt',
];

// Old binary Office formats (.doc/.xls/.ppt) all share the OLE Compound
// File signature; the modern XML formats (.docx/.xlsx/.pptx) are just zip
// archives, same as .zip itself.
const OLE_COMPOUND_FILE_SIGNATURE = 'd0cf11e0a1b11ae1';
const ZIP_SIGNATURES = ['504b0304', '504b0506', '504b0708'];

// Extension checks alone only look at the filename, which a malicious
// upload can trivially spoof (rename payload.exe to payload.pdf). This
// checks the file's actual leading bytes against the signature its claimed
// extension implies, so a renamed file gets rejected instead of silently
// accepted and later opened by whoever reviews the application.
async function matchesFileSignature(file, extension) {
  const head = Buffer.from(await file.slice(0, 8).arrayBuffer()).toString('hex').toLowerCase();
  switch (extension) {
    case 'pdf':
      return head.startsWith('25504446'); // %PDF
    case 'doc':
    case 'xls':
    case 'ppt':
      return head.startsWith(OLE_COMPOUND_FILE_SIGNATURE);
    case 'docx':
    case 'xlsx':
    case 'pptx':
    case 'zip':
      return ZIP_SIGNATURES.some((sig) => head.startsWith(sig));
    case 'jpg':
    case 'jpeg':
      return head.startsWith('ffd8ff');
    case 'png':
      return head.startsWith('89504e47');
    case 'txt':
      // Plain text has no real magic number - the goal here is just to
      // reject an executable hiding behind a .txt name, not to validate
      // that the contents are "really" text.
      return !head.startsWith('4d5a') && !head.startsWith('7f454c46');
    default:
      return false;
  }
}

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
  if (!(await matchesFileSignature(resumeFile, extension))) {
    return NextResponse.json(
      { error: "Resume file content doesn't match its extension." },
      { status: 400 }
    );
  }

  const additionalFiles = formData
    .getAll('additionalFiles')
    .filter((entry) => entry instanceof File && entry.size > 0);
  if (additionalFiles.length > MAX_ADDITIONAL_FILES) {
    return NextResponse.json(
      { error: `Up to ${MAX_ADDITIONAL_FILES} additional files are allowed.` },
      { status: 400 }
    );
  }
  const additionalTotalBytes = additionalFiles.reduce((sum, file) => sum + file.size, 0);
  if (additionalTotalBytes > MAX_ADDITIONAL_TOTAL_BYTES) {
    return NextResponse.json(
      { error: 'Additional files must total 20MB or less.' },
      { status: 400 }
    );
  }
  for (const file of additionalFiles) {
    const additionalExtension = file.name.split('.').pop()?.toLowerCase();
    if (!additionalExtension || !ALLOWED_ADDITIONAL_EXTENSIONS.includes(additionalExtension)) {
      return NextResponse.json(
        { error: `Unsupported additional file type: ${file.name}.` },
        { status: 400 }
      );
    }
    if (!(await matchesFileSignature(file, additionalExtension))) {
      return NextResponse.json(
        { error: `File content doesn't match its extension: ${file.name}.` },
        { status: 400 }
      );
    }
  }

  try {
    const resumePath = await uploadResume(resumeFile, {
      firstName: fields.firstName,
      lastName: fields.lastName,
    });
    const attachmentPaths =
      additionalFiles.length > 0
        ? await uploadAdditionalFiles(additionalFiles, {
            firstName: fields.firstName,
            lastName: fields.lastName,
          })
        : [];
    await createJobApplication({ ...fields, resumePath, attachmentPaths });
    return NextResponse.json({ ok: true });
  } catch (err) {
    // Logged server-side for diagnosis; the client only ever sees a
    // generic message (see JobApplicationForm's error copy) - no internal
    // error detail or stack gets sent to the applicant.
    console.error('Job application submission failed:', err);
    return NextResponse.json({ error: 'Failed to submit application.' }, { status: 502 });
  }
}
