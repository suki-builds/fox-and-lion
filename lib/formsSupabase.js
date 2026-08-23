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
