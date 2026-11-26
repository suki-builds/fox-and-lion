import { paintGrid } from '../canvas';

// Square cells: noise sampled on a grid and quantised to the palette, with
// a scattering of cells flipped to the next colour for a micro-pattern.
function render(ctx, width, height, { rng, noise, palette, feature }) {
  const n = palette.length;
  const cell = Math.max(2, Math.round(feature / 5));
  const cols = Math.ceil(width / cell);
  const rows = Math.ceil(height / cell);
  const offsets = palette.map(() => [rng.range(0, 500), rng.range(0, 500)]);
  const thresholds = palette.map((_, i) => 0.47 + 0.035 * i);
  const warp = rng.range(0, 500);

  paintGrid(ctx, cols, rows, cell, palette, (c, r) => {
    const bu = ((c + 0.5) * cell) / feature;
    const bv = (((r + 0.5) * cell) / feature) * 1.2;
    const u = bu + (noise.fbm(bu * 0.45 + warp, bv * 0.45, 2) - 0.5) * 2;
    const v = bv + (noise.fbm(bu * 0.45, bv * 0.45 + warp, 2) - 0.5) * 2;
    let index = 0;
    for (let i = 1; i < n; i += 1) {
      if (noise.fbm(u * 0.6 + offsets[i][0], v * 0.6 + offsets[i][1], 3) > thresholds[i]) index = i;
    }
    // Whole-number coordinates make noise2 a per-cell hash.
    if (noise.noise2(c + 1013, r + 7) < 0.09) index = (index + 1) % n;
    return index;
  });
}

export default { id: 'digital', label: 'Digital', render };
