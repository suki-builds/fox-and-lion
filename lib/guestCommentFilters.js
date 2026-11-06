import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from 'obscenity';

// Checks for guest comments (see app/api/guest-comment/route.js). Nothing
// here rejects a comment for its content - anything suspicious is held for
// a moderator instead, so a false positive costs a short delay rather than
// a lost comment. Only the name can be refused outright.

// obscenity's English list, with its transformers for leetspeak, spacing
// tricks and repeated letters ("f u c k", "fuuuck", "sh1t").
const profanity = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

// A URL, a www. address or a bare domain with a common TLD. Real comments
// rarely need a link, and spam almost always has one.
const LINK = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|co|uk|ru|cn|xyz|info|biz|top|site|online|shop|app)\b)/i;

// Ten or more of the same character in a row.
const REPETITION = /(.)\1{9,}/;

// Mirrors is_username_blocked() in supabase/migrations/0012_block_staff_names.sql
// so a guest can't pose as staff either. "mod" only matches the whole name
// here, not inside one - guest names are often real names, and blocking
// "Desmond" would be a worse trade than it is for usernames.
const IMPERSONATION = /(admin|moderator|foxandlion|foxlion|sohyunpark|jinhyunglee|sukipark)/;

// Deliberately loose - the real check would be a confirmation email, which
// guests don't get. This only catches typos and junk.
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
export const EMAIL_MAX = 254;

// Returns an error message for an email that can't be used, or null.
export function checkGuestEmail(email) {
  if (!email || email.length > EMAIL_MAX || !EMAIL.test(email)) {
    return 'Please enter a valid email address.';
  }
  return null;
}

export const NAME_MIN = 2;
export const NAME_MAX = 40;
export const BODY_MAX = 2000;

// Returns an error message for a name that can't be used, or null.
export function checkGuestName(name) {
  if (name.length < NAME_MIN || name.length > NAME_MAX) {
    return `Please use a name between ${NAME_MIN} and ${NAME_MAX} characters.`;
  }
  const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (normalized === 'mod' || IMPERSONATION.test(normalized) || profanity.hasMatch(name)) {
    return 'That name isn’t available - please choose another.';
  }
  return null;
}

// Returns the reasons to hold a comment for review. Empty means publish.
export function flagReasons(body) {
  const reasons = [];
  if (profanity.hasMatch(body)) reasons.push('profanity');
  if (LINK.test(body)) reasons.push('link');
  if (REPETITION.test(body)) reasons.push('repetition');

  const letters = body.replace(/[^A-Za-z]/g, '');
  if (letters.length >= 20 && letters.replace(/[^A-Z]/g, '').length / letters.length > 0.7) {
    reasons.push('shouting');
  }

  return reasons;
}
