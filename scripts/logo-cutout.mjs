// Cuts the original Pink Knots logo out of its white background without touching the artwork:
//   node scripts/logo-cutout.mjs
// Source: docs/brand/pink-knots-logo-original.png — the 120 × 120 file pink-knots.com serves
// (the largest that exists). Never edited; this writes public/brand/pink-knots-logo.png.
//
// - Background = near-white neutral pixels. They become fully transparent.
// - Artwork interior pixels keep their exact original RGB at full opacity.
// - Only the 1px anti-aliased fringe is un-matted: its alpha is solved against the colour of the
//   neighbouring artwork, so edges blend into any background without a white halo.
// - Specks of ≤ 5px (JPEG ringing around the ribbon and at the image edge) are dropped.
//   The smallest real detail, the dot of the "i", is 9px.
import sharp from "sharp";

const SRC = "docs/brand/pink-knots-logo-original.png";
const OUT = "public/brand/pink-knots-logo.png";
const SPECK = 5;

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width;
const H = info.height;
const N = W * H;

const isBackground = (i) => {
  const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2], a = data[i * 4 + 3];
  const lo = Math.min(r, g, b);
  return a < 16 || (lo >= 226 && Math.max(r, g, b) - lo <= 30);
};
const bg = new Uint8Array(N);
for (let i = 0; i < N; i++) bg[i] = isBackground(i) ? 1 : 0;

const neighbours = (p, fn) => {
  const x = p % W, y = (p / W) | 0;
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy;
      if ((dx || dy) && nx >= 0 && ny >= 0 && nx < W && ny < H) fn(ny * W + nx);
    }
};

// Drop specks
const seen = new Uint8Array(N);
for (let s = 0; s < N; s++) {
  if (bg[s] || seen[s]) continue;
  const comp = [s];
  seen[s] = 1;
  for (let k = 0; k < comp.length; k++)
    neighbours(comp[k], (q) => {
      if (!bg[q] && !seen[q]) (seen[q] = 1), comp.push(q);
    });
  if (comp.length <= SPECK) for (const p of comp) bg[p] = 1;
}

// Fringe = artwork pixels touching background
const fringe = new Uint8Array(N);
for (let p = 0; p < N; p++) if (!bg[p]) neighbours(p, (q) => bg[q] && (fringe[p] = 1));

const out = Buffer.alloc(N * 4);
for (let p = 0; p < N; p++) {
  const i = p * 4;
  if (bg[p]) continue; // transparent
  const o = [data[i], data[i + 1], data[i + 2]];
  if (!fringe[p]) {
    out.set([...o, 255], i);
    continue;
  }
  // Foreground colour = mean of adjacent interior pixels (fall back to the pixel itself)
  let f = [0, 0, 0], n = 0;
  neighbours(p, (q) => {
    if (!bg[q] && !fringe[q]) (f[0] += data[q * 4]), (f[1] += data[q * 4 + 1]), (f[2] += data[q * 4 + 2]), n++;
  });
  f = n ? f.map((v) => v / n) : o;
  // Observed = a·F + (1 − a)·white  →  project onto the white→F line
  const d = f.map((v) => v - 255), e = o.map((v) => v - 255);
  const dd = d[0] * d[0] + d[1] * d[1] + d[2] * d[2];
  let a = dd > 1 ? (e[0] * d[0] + e[1] * d[1] + e[2] * d[2]) / dd : 1;
  a = Math.min(1, Math.max(0, a));
  if (a < 0.04) continue;
  // Colour with the white removed, kept within range
  const c = o.map((v) => Math.round(Math.min(255, Math.max(0, (v - 255 * (1 - a)) / a))));
  out.set([...c, Math.round(a * 255)], i);
}

await sharp(out, { raw: { width: W, height: H, channels: 4 } }).trim({ threshold: 0 }).png({ compressionLevel: 9 }).toFile(OUT);
const meta = await sharp(OUT).metadata();
console.log(`${OUT} ${meta.width}×${meta.height}`);
