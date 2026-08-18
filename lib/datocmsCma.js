// Thin wrapper around DatoCMS's Content Management API (REST/JSON:API),
// used for writes - the GraphQL client in lib/datocms.js is CDA-only
// (read), so this is a separate surface with its own auth.
const CMA_BASE = 'https://site-api.datocms.com';

async function cmaRequest(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${CMA_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Api-Version': '3',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = data?.errors?.[0]?.detail || data?.errors?.[0]?.title || res.statusText;
    throw new Error(`DatoCMS CMA ${method} ${path} failed (${res.status}): ${message}`);
  }
  return data;
}

// Item type IDs aren't the same as their api_key, and the create-item
// endpoint needs the ID - resolved by api_key once per lambda instance
// and kept in memory rather than re-fetched on every submission.
let pitchSubmissionItemTypeId = null;

async function getPitchSubmissionItemTypeId(token) {
  if (pitchSubmissionItemTypeId) return pitchSubmissionItemTypeId;

  const { data } = await cmaRequest('/item-types', { token });
  const itemType = data.find((it) => it.attributes.api_key === 'pitch_submission');
  if (!itemType) {
    throw new Error('DatoCMS: no item type found with api_key "pitch_submission"');
  }
  pitchSubmissionItemTypeId = itemType.id;
  return pitchSubmissionItemTypeId;
}

// Creates a Pitch Submission record. reviewStatus is deliberately omitted
// from attributes so the field's own default ("Received") applies.
export async function createPitchSubmission({ firstName, lastName, email, bio, pitch }) {
  const token = process.env.DATOCMS_PITCH_SUBMISSION_TOKEN;
  if (!token) {
    throw new Error('DATOCMS_PITCH_SUBMISSION_TOKEN is not set');
  }

  const itemTypeId = await getPitchSubmissionItemTypeId(token);

  await cmaRequest('/items', {
    method: 'POST',
    token,
    body: {
      data: {
        type: 'item',
        attributes: {
          first_name: firstName,
          last_name: lastName,
          email,
          professional_biography: bio,
          pitch,
        },
        relationships: {
          item_type: { data: { type: 'item_type', id: itemTypeId } },
        },
      },
    },
  });
}
