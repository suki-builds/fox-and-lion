// Canvas helpers shared by the camouflage pattern renderers.

// A scratch canvas that never touches the page. OffscreenCanvas where the
// browser has it, a detached <canvas> otherwise.
export function makeCanvas(width, height) {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(width, height);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Paints a per-pixel field: `sample(x, y)` returns a palette index for a
// point in output pixels. `budget` caps how many points are sampled - the
// preview samples a reduced grid and scales it up smoothly, so it stays
// fast; exports pass Infinity and sample every pixel.
export function paintField(ctx, width, height, budget, palette, sample) {
  const f = Math.min(1, Math.sqrt(budget / (width * height)));
  const fw = Math.max(1, Math.ceil(width * f));
  const fh = Math.max(1, Math.ceil(height * f));
  const rgb = palette.map(hexToRgb);
  const off = makeCanvas(fw, fh);
  const octx = off.getContext('2d');
  const img = octx.createImageData(fw, fh);
  const data = img.data;
  const sx = width / fw;
  const sy = height / fh;
  let k = 0;
  for (let y = 0; y < fh; y += 1) {
    const py = (y + 0.5) * sy;
    for (let x = 0; x < fw; x += 1) {
      const c = rgb[sample((x + 0.5) * sx, py)];
      data[k] = c[0];
      data[k + 1] = c[1];
      data[k + 2] = c[2];
      data[k + 3] = 255;
      k += 4;
    }
  }
  octx.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(off, 0, 0, width, height);
}

// Paints a grid of square cells, one palette index per cell, with hard
// edges. Used by the digital family.
export function paintGrid(ctx, cols, rows, cell, palette, sample) {
  const rgb = palette.map(hexToRgb);
  const off = makeCanvas(cols, rows);
  const octx = off.getContext('2d');
  const img = octx.createImageData(cols, rows);
  const data = img.data;
  let k = 0;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const col = rgb[sample(c, r)];
      data[k] = col[0];
      data[k + 1] = col[1];
      data[k + 2] = col[2];
      data[k + 3] = 255;
      k += 4;
    }
  }
  octx.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(off, 0, 0, cols * cell, rows * cell);
  ctx.imageSmoothingEnabled = true;
}

// Fills a closed polygon from a flat [x0, y0, x1, y1, ...] list.
export function fillPolygon(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) ctx.lineTo(points[i], points[i + 1]);
  ctx.closePath();
  ctx.fill();
}
