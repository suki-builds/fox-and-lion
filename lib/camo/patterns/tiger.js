import { paintField } from '../canvas';

// Broken horizontal stripes over a mottled ground: a warped sine wave,
// interrupted by noise so the stripes break up rather than run solid.
function render(ctx, width, height, { rng, noise, palette, feature, budget }) {
  const n = palette.length;
  const o = Array.from({ length: 4 }, () => rng.range(0, 500));
  const stripe = n - 1;
  const frequency = rng.range(2.1, 2.7);

  paintField(ctx, width, height, budget, palette, (x, y) => {
    const u = x / feature;
    const v = y / feature;
    let index = noise.fbm(u * 0.3 + o[0], v * 0.45, 3) > 0.55 ? 1 : 0;
    if (n >= 5 && noise.fbm(u * 1.6 + o[3], v * 2.4, 2) > 0.66) index = 3;
    // Gentle, long-wavelength bends so the stripes stay mostly level.
    const warp = noise.fbm(u * 0.18 + o[1], v * 0.4, 3);
    const s = Math.sin((v * frequency + warp * 2.4) * Math.PI);
    // Breaks along each stripe, short horizontally so they taper and split.
    const breakup = noise.fbm(u * 0.75 + o[2], v * 2.6, 2);
    if (s > 0.6 && breakup > 0.44) return stripe;
    if (n >= 4 && s < -0.82 && breakup > 0.52) return 2;
    return index;
  });
}

export default { id: 'tiger', label: 'Tiger stripe', render };
