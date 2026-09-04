import { createClient } from './supabase/server';

// Creates a Pitch Submission row. review_status is deliberately omitted so
// the column's own default ('Received') applies.
export async function createPitchSubmission({ firstName, lastName, email, bio, pitch }) {
  const supabase = createClient();
  const { error } = await supabase.from('pitch_submissions').insert({
    first_name: firstName,
    last_name: lastName,
    email,
    bio,
    pitch,
  });
  if (error) {
    throw new Error(`Supabase insert into pitch_submissions failed: ${error.message}`);
  }
}

// Creates a Contact Message row. replied is deliberately omitted so the
// column's own default (false) applies.
export async function createContactMessage({
  firstName,
  lastName,
  email,
  organisation,
  message,
}) {
  const supabase = createClient();
  const { error } = await supabase.from('contact_messages').insert({
    first_name: firstName,
    last_name: lastName,
    email,
    organisation,
    message,
  });
  if (error) {
    throw new Error(`Supabase insert into contact_messages failed: ${error.message}`);
  }
}

// Shared by uploadResume and uploadAdditionalFiles so both land under a
// recognisable, matching name in the dashboard rather than an opaque id.
function buildApplicantSlug({ firstName, lastName }) {
  return (
    `${lastName}-${firstName}`
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'applicant'
  );
}

function sanitizeFileName(name) {
  const lastDot = name.lastIndexOf('.');
  const base = lastDot > 0 ? name.slice(0, lastDot) : name;
  const ext = lastDot > 0 ? name.slice(lastDot + 1) : '';
  const safeBase = base.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'file';
  const safeExt = ext.toLowerCase().replace(/[^a-z0-9]/g, '');
  return safeExt ? `${safeBase}.${safeExt}` : safeBase;
}

// Builds a storage path that's easy to recognise while browsing the
// "resumes" bucket in the Supabase dashboard (the only place these are ever
// read back from - see uploadResume below), rather than an opaque random
// id. Privacy here comes from the bucket being private + RLS only granting
// anon insert (no select/list), not from the path being hard to guess, so
// there's no need to obscure it.
function buildResumePath({ firstName, lastName }, file) {
  const ext = (file.name.split('.').pop() || 'pdf').toLowerCase().replace(/[^a-z0-9]/g, '') || 'pdf';
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${buildApplicantSlug({ firstName, lastName })}-${stamp}.${ext}`;
}

// Uploads a résumé/CV to the private "resumes" Storage bucket and returns
// its path. Uses the same anon-key client as every other Supabase call
// here - it's permitted to insert into this bucket (see the "anon insert
// only" storage policy in README.md) but can't read anything back, which
// is what actually keeps these files private, not the path itself.
export async function uploadResume(file, { firstName, lastName }) {
  const supabase = createClient();
  const path = buildResumePath({ firstName, lastName }, file);
  const { error } = await supabase.storage.from('resumes').upload(path, file, {
    contentType: file.type || 'application/octet-stream',
  });
  if (error) {
    throw new Error(`Supabase storage upload to resumes failed: ${error.message}`);
  }
  return path;
}

// Uploads up to 5 supplementary files (portfolio samples, references,
// certificates, etc.) to the private "application-attachments" Storage
// bucket - separate from "resumes" since these are optional and unbounded
// in type, unlike the single required CV. All files for one submission are
// grouped under one folder (named like the resume) so they're easy to find
// together in the dashboard; each keeps a sanitised version of its original
// name so it's still recognisable after upload. Same anon-insert-only
// privacy model as uploadResume - see the "resumes" bucket note above.
export async function uploadAdditionalFiles(files, { firstName, lastName }) {
  const supabase = createClient();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const folder = `${buildApplicantSlug({ firstName, lastName })}-${stamp}`;
  const paths = [];
  for (const [index, file] of files.entries()) {
    const path = `${folder}/${index + 1}-${sanitizeFileName(file.name)}`;
    const { error } = await supabase.storage.from('application-attachments').upload(path, file, {
      contentType: file.type || 'application/octet-stream',
    });
    if (error) {
      throw new Error(`Supabase storage upload to application-attachments failed: ${error.message}`);
    }
    paths.push(path);
  }
  return paths;
}

// Creates a Job Application row, submitted through a manually-posted
// careers_post's /apply page. reviewed is deliberately omitted so the
// column's own default (false) applies. resume_path holds the CV's path
// within the private "resumes" bucket (see uploadResume); attachment_paths
// holds the paths (if any) within "application-attachments" (see
// uploadAdditionalFiles) - open either from the Supabase dashboard's
// Storage browser, not a link in this row.
export async function createJobApplication({
  careersPostUid,
  jobTitle,
  companyName,
  firstName,
  lastName,
  email,
  linkedinUrl,
  resumePath,
  attachmentPaths,
  coverNote,
}) {
  const supabase = createClient();
  const { error } = await supabase.from('job_applications').insert({
    careers_post_uid: careersPostUid,
    job_title: jobTitle,
    company_name: companyName,
    first_name: firstName,
    last_name: lastName,
    email,
    linkedin_url: linkedinUrl || null,
    resume_path: resumePath,
    attachment_paths: attachmentPaths && attachmentPaths.length > 0 ? attachmentPaths : [],
    cover_note: coverNote || null,
  });
  if (error) {
    throw new Error(`Supabase insert into job_applications failed: ${error.message}`);
  }
}
