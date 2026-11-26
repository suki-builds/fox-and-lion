// Broad, tapered, slightly curved strokes laid in colour layers over the
// ground colour, as if painted by hand.

function stroke(ctx, rng, cx, cy, angle, length, width) {
  const steps = 10;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const nx = -dy;
  const ny = dx;
  const bend = rng.range(-0.22, 0.22) * length;
  const top = [];
  const bottom = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const along = (t - 0.5) * length;
    const curve = bend * (1 - (2 * t - 1) ** 2);
    const half = (width / 2) * Math.sin(Math.PI * t) ** 0.6 * rng.range(0.7, 1.15);
    const px = cx + dx * along + nx * curve;
    const py = cy + dy * along + ny * curve;
    top.push(px + nx * half, py + ny * half);
    bottom.push(px - nx * half, py - ny * half);
  }
  ctx.beginPath();
  ctx.moveTo(top[0], top[1]);
  for (let i = 2; i < top.length; i += 2) ctx.lineTo(top[i], top[i + 1]);
  for (let i = bottom.length - 2; i >= 0; i -= 2) ctx.lineTo(bottom[i], bottom[i + 1]);
  ctx.closePath();
  ctx.fill();
}

function render(ctx, width, height, { rng, palette, feature }) {
  ctx.fillStyle = palette[0];
  ctx.fillRect(0, 0, width, height);
  const area = ((width + 4 * feature) * (height + 4 * feature)) / (feature * feature);
  const baseAngle = rng.range(-0.6, 0.6);

  for (let i = 1; i < palette.length; i += 1) {
    ctx.fillStyle = palette[i];
    const count = Math.round(area * Math.max(0.5, 1.5 - 0.25 * i));
    for (let s = 0; s < count; s += 1) {
      stroke(
        ctx,
        rng,
        rng.range(-2 * feature, width + 2 * feature),
        rng.range(-2 * feature, height + 2 * feature),
        baseAngle + rng.range(-0.5, 0.5),
        feature * rng.range(0.9, 2.4),
        feature * rng.range(0.22, 0.5),
      );
    }
  }
}

export default { id: 'brushstroke', label: 'Brushstroke', render };
