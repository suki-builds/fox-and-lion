import { createRng, randomSeed, SEED_PATTERN } from './prng';
import { createNoise } from './noise';
import { paletteFor, TERRAIN_BY_ID } from './palettes';
import { FAMILIES, FAMILY_BY_ID } from './patterns';

export const DEFAULTS = { family: 'woodland', terrain: 'temperate', colours: 4, scale: 3 };
export const COLOURS_MIN = 3;
export const COLOURS_MAX = 5;
export const SCALE_MIN = 1;
export const SCALE_MAX = 5;

export const PRESETS = {
  phone: { width: 1170, height: 2532, label: 'Phone wallpaper', slug: 'phone' },
  banner: { width: 1584, height: 396, label: 'LinkedIn banner', slug: 'banner' },
};

function clampInt(value, min, max, fallback) {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

// Settings from the query string. Anything missing or invalid falls back to
// a default, and a missing seed gets a fresh one.
export function readState(search) {
  const params = new URLSearchParams(search);
  const seed = (params.get('seed') || '').toLowerCase();
  const family = params.get('family');
  const terrain = params.get('terrain');
  return {
    seed: SEED_PATTERN.test(seed) ? seed : randomSeed(),
    family: FAMILY_BY_ID[family] ? family : DEFAULTS.family,
    terrain: TERRAIN_BY_ID[terrain] ? terrain : DEFAULTS.terrain,
    colours: clampInt(params.get('colours'), COLOURS_MIN, COLOURS_MAX, DEFAULTS.colours),
    scale: clampInt(params.get('scale'), SCALE_MIN, SCALE_MAX, DEFAULTS.scale),
  };
}

export function toQuery(state) {
  return new URLSearchParams({
    seed: state.seed,
    family: state.family,
    terrain: state.terrain,
    colours: String(state.colours),
    scale: String(state.scale),
  }).toString();
}

// Draws the pattern for `state` across the whole canvas. Shape sizes are a
// fraction of the shorter side, so the preview and the downloads show the
// same pattern in proportion. The terrain only swaps colours: the shapes
// come from the seed and family alone.
export function renderPattern(ctx, width, height, state, { budget = Infinity } = {}) {
  const family = FAMILY_BY_ID[state.family] || FAMILIES[0];
  const root = createRng(state.seed);
  family.render(ctx, width, height, {
    rng: root.fork(`pattern:${family.id}`),
    noise: createNoise(root.fork('noise')),
    palette: paletteFor(state.terrain, state.colours),
    feature: Math.min(width, height) * (0.05 + 0.03 * state.scale),
    budget,
  });
}

// The small "Fox and Lion / foxandlion.pub" mark, bottom right, on exports
// only. Set in the site's label font when it has loaded.
async function drawWatermark(ctx, width, height, presetId) {
  const size = Math.max(14, Math.min(28, Math.round(Math.sqrt(width * height) * 0.012)));
  const labelFont = getComputedStyle(document.documentElement).getPropertyValue('--font-label').trim();
  const font = `600 ${size}px ${labelFont ? `${labelFont}, ` : ''}Arial, sans-serif`;
  const text = 'Fox and Lion / foxandlion.pub';
  try {
    await document.fonts.load(font, text);
  } catch {
    // Falls back to Arial.
  }
  ctx.font = font;
  ctx.textBaseline = 'middle';
  const padX = size * 0.7;
  const padY = size * 0.45;
  const boxW = ctx.measureText(text).width + padX * 2;
  const boxH = size + padY * 2;
  const margin = Math.round(size * 1.2);
  // Clear of the home indicator on phones.
  const bottom = presetId === 'phone' ? Math.round(height * 0.045) : margin;
  const x = width - margin - boxW;
  const y = height - bottom - boxH;
  ctx.fillStyle = 'rgba(10, 13, 19, 0.55)';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, boxW, boxH, size * 0.25);
  else ctx.rect(x, y, boxW, boxH);
  ctx.fill();
  ctx.fillStyle = 'rgba(244, 242, 236, 0.85)';
  ctx.fillText(text, x + padX, y + boxH / 2);
}

// Renders a download at full size off-screen and returns it as a PNG blob.
export async function exportImage(presetId, state) {
  const preset = PRESETS[presetId];
  const canvas = document.createElement('canvas');
  canvas.width = preset.width;
  canvas.height = preset.height;
  const ctx = canvas.getContext('2d');
  renderPattern(ctx, preset.width, preset.height, state);
  await drawWatermark(ctx, preset.width, preset.height, presetId);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Export failed'))), 'image/png');
  });
}
