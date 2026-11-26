import { fillPolygon } from '../canvas';

// Angular shards along two dominant directions, with short "rain" dashes
// over the top.
function render(ctx, width, height, { rng, palette, feature }) {
  ctx.fillStyle = palette[0];
  ctx.fillRect(0, 0, width, height);
  const area = ((width + 4 * feature) * (height + 4 * feature)) / (feature * feature);
  const baseAngle = rng.range(-0.9, 0.9);

  for (let i = 1; i < palette.length; i += 1) {
    ctx.fillStyle = palette[i];
    const count = Math.round(area * Math.max(0.35, 1.05 - 0.2 * i));
    for (let s = 0; s < count; s += 1) {
      const cx = rng.range(-2 * feature, width + 2 * feature);
      const cy = rng.range(-2 * feature, height + 2 * feature);
      const angle = baseAngle + (rng.chance(0.35) ? rng.pick([0.55, -0.55]) : 0) + rng.range(-0.1, 0.1);
      const half = (feature * rng.range(1, 2.8)) / 2;
      const w = (feature * rng.range(0.35, 1)) / 2;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      const nx = -dy;
      const ny = dx;
      const a = rng.range(0.8, 1) * half;
      const t1 = rng.range(-0.5, 0.5) * half;
      const t2 = rng.range(-0.5, 0.5) * half;
      const w1 = w * rng.range(0.5, 1);
      const w2 = w * rng.range(0.5, 1);
      fillPolygon(ctx, [
        cx + dx * a, cy + dy * a,
        cx + dx * t1 + nx * w1, cy + dy * t1 + ny * w1,
        cx - dx * half, cy - dy * half,
        cx + dx * t2 - nx * w2, cy + dy * t2 - ny * w2,
      ]);
    }
  }

  // Rain: short, near-vertical dashes in the last colour.
  ctx.strokeStyle = palette[palette.length - 1];
  ctx.lineWidth = Math.max(1, feature * 0.035);
  ctx.lineCap = 'butt';
  ctx.globalAlpha = 0.85;
  const dashes = Math.round(area * 4);
  ctx.beginPath();
  for (let s = 0; s < dashes; s += 1) {
    const x = rng.range(0, width);
    const y = rng.range(0, height);
    const angle = Math.PI / 2 + rng.range(-0.08, 0.08);
    const len = feature * rng.range(0.15, 0.35);
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
}

export default { id: 'splinter', label: 'Splinter', render };
