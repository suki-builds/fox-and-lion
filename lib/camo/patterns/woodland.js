import { paintField } from '../canvas';

// Organic, interlocking blobs: each colour is a layer of domain-warped
// fractal noise, cut off at a threshold, stretched slightly sideways.
function render(ctx, width, height, { rng, noise, palette, feature, budget }) {
  const n = palette.length;
  const offsets = palette.map(() => [rng.range(0, 500), rng.range(0, 500)]);
  const thresholds = palette.map((_, i) => 0.47 + 0.035 * i);
  const warp = [rng.range(0, 500), rng.range(0, 500)];

  paintField(ctx, width, height, budget, palette, (x, y) => {
    const bu = x / feature;
    const bv = (y / feature) * 1.3;
    const u = bu + (noise.fbm(bu * 0.45 + warp[0], bv * 0.45, 2) - 0.5) * 2.2;
    const v = bv + (noise.fbm(bu * 0.45, bv * 0.45 + warp[1], 2) - 0.5) * 2.2;
    let index = 0;
    for (let i = 1; i < n; i += 1) {
      if (noise.fbm(u * 0.55 + offsets[i][0], v * 0.55 + offsets[i][1], 3) > thresholds[i]) index = i;
    }
    return index;
  });
}

export default { id: 'woodland', label: 'Woodland', render };
