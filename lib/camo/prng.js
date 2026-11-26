// Seeded randomness for the camouflage generator (/tools/camo). Everything a
// pattern looks like comes from its seed string, so the same seed always
// draws the same pattern - that is what makes a shared link reproducible.

// cyrb53: a small, well-distributed string hash. Turns the seed text into
// the 32-bit starting state for mulberry32 below.
function hashString(str) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i += 1) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 ^ h1) >>> 0;
}

// mulberry32: a fast 32-bit PRNG, plenty for drawing shapes.
function mulberry32(seed) {
  let a = seed;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// fork(label) gives an independent stream for one job (the pattern, the
// name, the noise), so changing one setting doesn't reshuffle the others -
// e.g. changing the scale keeps the same designation.
export function createRng(seed) {
  const next = mulberry32(hashString(String(seed)));
  const rng = {
    next,
    range: (min, max) => min + next() * (max - min),
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    chance: (p) => next() < p,
    pick: (list) => list[Math.floor(next() * list.length)],
    shuffle(list) {
      const out = [...list];
      for (let i = out.length - 1; i > 0; i -= 1) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
    fork: (label) => createRng(`${seed}:${label}`),
  };
  return rng;
}

const SEED_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
export const SEED_PATTERN = /^[a-z0-9]{4,16}$/;

// A fresh 8-character seed for "Randomise" and first visits.
export function randomSeed() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => SEED_ALPHABET[b % SEED_ALPHABET.length]).join('');
}
