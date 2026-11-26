import { createRng } from './prng';

// Designations for generated patterns, e.g. "FL-26 Fenland Splinter":
// a number, a word drawn from UK and European geography, and a noun for
// the pattern family. Derived from the seed and family only, so changing
// the terrain, colours or scale keeps the same name.

const PLACES = [
  'Fenland', 'Cairngorm', 'Pennine', 'Brecon', 'Mendip', 'Dartmoor',
  'Exmoor', 'Snowdon', 'Galloway', 'Kintyre', 'Wessex', 'Cheviot',
  'Chiltern', 'Cotswold', 'Breckland', 'Solway', 'Orkney', 'Hebridean',
  'Quantock', 'Lomond', 'Ardennes', 'Jutland', 'Lofoten', 'Carpathian',
  'Eifel', 'Vosges', 'Jura', 'Camargue', 'Pyrenean', 'Dolomite',
  'Karst', 'Masurian', 'Frisian', 'Zeeland', 'Hardanger', 'Finnmark',
  'Tatra', 'Alentejo', 'Meseta', 'Ligurian', 'Argonne', 'Bohemian',
];

const NOUNS = {
  woodland: ['Woodland', 'Copse', 'Thicket'],
  brushstroke: ['Brushstroke', 'Stroke'],
  splinter: ['Splinter', 'Shard'],
  tiger: ['Tiger', 'Stripe'],
  digital: ['Digital', 'Pixel', 'Grid'],
};

// One line on the real-world family each generator is inspired by. Kept
// generic on purpose: no named or protected patterns.
export const NOTES = {
  woodland:
    'Inspired by the organic, multi-colour woodland patterns fielded widely in the late Cold War.',
  brushstroke:
    'Inspired by the brushstroke patterns used by British and Commonwealth forces from the 1960s onwards.',
  splinter: 'Inspired by the angular splinter patterns first fielded in Germany in the 1930s.',
  tiger: 'Inspired by the tiger stripe patterns worn in Southeast Asia from the 1960s.',
  digital:
    'Inspired by the pixelated micro-patterns adopted by many armed forces from the early 2000s.',
};

export function designationFor(seed, family) {
  const rng = createRng(seed).fork(`name:${family}`);
  const number = rng.int(10, 99);
  const place = rng.pick(PLACES);
  const noun = rng.pick(NOUNS[family] || ['Pattern']);
  return `FL-${number} ${place} ${noun}`;
}
