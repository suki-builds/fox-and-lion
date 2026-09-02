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

// Creates a Job Application row, submitted through a manually-posted
// careers_post's /apply page. reviewed is deliberately omitted so the
// column's own default (false) applies.
export async function createJobApplication({
  careersPostUid,
  jobTitle,
  companyName,
  firstName,
  lastName,
  email,
  linkedinUrl,
  resumeUrl,
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
    resume_url: resumeUrl,
    cover_note: coverNote || null,
  });
  if (error) {
    throw new Error(`Supabase insert into job_applications failed: ${error.message}`);
  }
}
