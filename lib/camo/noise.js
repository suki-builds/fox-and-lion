// Seeded 2D value noise and fractal (fbm) noise for the camouflage
// generator. Small enough to keep inline rather than add a dependency.

export function createNoise(rng) {
  const order = rng.shuffle([...Array(256).keys()]);
  const perm = new Uint16Array(512);
  for (let i = 0; i < 512; i += 1) perm[i] = order[i & 255];
  const values = new Float32Array(256);
  for (let i = 0; i < 256; i += 1) values[i] = rng.next();

  // Smoothly interpolated noise in 0..1. At whole-number coordinates it
  // returns the lattice value itself, which also makes it a cheap hash.
  function noise2(x, y) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const X = xi & 255;
    const Y = yi & 255;
    const a = values[perm[perm[X] + Y]];
    const b = values[perm[perm[X + 1] + Y]];
    const c = values[perm[perm[X] + Y + 1]];
    const d = values[perm[perm[X + 1] + Y + 1]];
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }

  // Several octaves of noise added together, normalised back to 0..1.
  function fbm(x, y, octaves = 3) {
    let sum = 0;
    let amp = 0.5;
    let norm = 0;
    let freq = 1;
    for (let o = 0; o < octaves; o += 1) {
      sum += amp * noise2(x * freq, y * freq);
      norm += amp;
      amp *= 0.5;
      freq *= 2.03;
    }
    return sum / norm;
  }

  return { noise2, fbm };
}
