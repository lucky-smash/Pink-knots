// Measures the infinity ribbon in the logo for the 3D gift-box knot: node scripts/measure-logo-ribbon.mjs
// Reads public/brand/pink-knots-logo.png (scripts/logo-cutout.mjs) and writes src/data/logo-ribbon.json:
// the ribbon's centre line from one end to the other, its visible width and its colour at each step.
//
// The ribbon is one open band: it starts as the indigo tip at the top left, runs down the magenta
// diagonal (over the crossing), round the right loop, back along the thin green stroke (under the
// crossing) and round the left loop to the lime tip. A hand-placed guide follows that route; each
// point is then snapped to the middle of the ribbon across its width, so the line is the logo's own.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const SRC = fileURLToPath(new URL("../public/brand/pink-knots-logo.png", import.meta.url));
const OUT = new URL("../src/data/logo-ribbon.json", import.meta.url);
const SYMBOL_ROWS = 66; // the infinity symbol; the wordmark starts below
const Z = 8; // measure on an 8× upsample so the centre line and widths aren't pixel-stepped
const N = 200; // samples along the ribbon

// Route guide in 8× pixels of the trimmed symbol (952 × 528), end A → end B. Passes the crossing twice.
const CROSS = [495, 300];
const GUIDE = [
  [40, 100], [110, 35], [200, 22], [275, 70], [340, 145], [420, 235], CROSS, [570, 365], [660, 415],
  [760, 440], [850, 425], [915, 370], [940, 290], [925, 205], [885, 145], [820, 105], [745, 95],
  [675, 112], [610, 160], [555, 225], CROSS, [440, 370], [370, 430], [285, 478], [195, 490],
  [120, 462], [68, 400], [38, 320], [30, 240], [42, 165],
];

const sym = await sharp(SRC).extract({ left: 0, top: 0, width: 119, height: SYMBOL_ROWS }).trim({ threshold: 0 }).toBuffer();
const { width: W0, height: H0 } = await sharp(sym).metadata();
const big = await sharp(sym).resize(W0 * Z, H0 * Z, { kernel: "cubic" }).raw().toBuffer({ resolveWithObject: true });
const orig = await sharp(sym).raw().toBuffer({ resolveWithObject: true });
const BW = big.info.width;
const BH = big.info.height;
const inside = (x, y) => {
  const xi = Math.round(x);
  const yi = Math.round(y);
  return xi >= 0 && yi >= 0 && xi < BW && yi < BH && big.data[(yi * BW + xi) * 4 + 3] > 140;
};
const colourAt = (x, y) => {
  const xi = Math.min(W0 - 1, Math.max(0, Math.floor(x / Z)));
  const yi = Math.min(H0 - 1, Math.max(0, Math.floor(y / Z)));
  const i = (yi * W0 + xi) * 4;
  return orig.data[i + 3] === 255 ? [orig.data[i], orig.data[i + 1], orig.data[i + 2]] : null;
};

// Centripetal-ish Catmull-Rom through the guide, resampled evenly by arc length
function spline(pts, n) {
  const dense = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const [p1, p2] = [pts[i], pts[i + 1]];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < 24; k++) {
      const t = k / 24;
      const t2 = t * t;
      const t3 = t2 * t;
      dense.push([0, 1].map((d) => 0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3)));
    }
  }
  dense.push(pts[pts.length - 1]);
  const len = [0];
  for (let i = 1; i < dense.length; i++) len.push(len[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
  const out = [];
  for (let s = 0, j = 0; s < n; s++) {
    const target = (len[len.length - 1] * s) / (n - 1);
    while (j < len.length - 2 && len[j + 1] < target) j++;
    const f = (target - len[j]) / (len[j + 1] - len[j] || 1);
    out.push([dense[j][0] + (dense[j + 1][0] - dense[j][0]) * f, dense[j][1] + (dense[j + 1][1] - dense[j][1]) * f]);
  }
  return out;
}

const normals = (pts) =>
  pts.map((_, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [-(b[1] - a[1]) / l, (b[0] - a[0]) / l];
  });
const smooth = (arr, r) =>
  arr.map((_, i) => {
    let s = Array.isArray(arr[0]) ? arr[0].map(() => 0) : 0;
    let n = 0;
    for (let k = Math.max(0, i - r); k <= Math.min(arr.length - 1, i + r); k++) {
      s = Array.isArray(s) ? s.map((v, d) => v + arr[k][d]) : s + arr[k];
      n++;
    }
    return Array.isArray(s) ? s.map((v) => v / n) : s / n;
  });

// The ribbon run along the normal through p: the contiguous inside stretch nearest to p
function run(p, nrm, reach = 48) {
  const hits = [];
  for (let d = -reach; d <= reach; d += 0.5) hits.push(inside(p[0] + nrm[0] * d, p[1] + nrm[1] * d) ? d : null);
  const runs = [];
  let start = null;
  hits.forEach((h, i) => {
    if (h !== null && start === null) start = h;
    if ((h === null || i === hits.length - 1) && start !== null) {
      runs.push([start, h ?? hits[i - 1]]);
      start = null;
    }
  });
  if (!runs.length) return null;
  runs.sort((a, b) => Math.abs((a[0] + a[1]) / 2) - Math.abs((b[0] + b[1]) / 2));
  return runs[0];
}

const nearCross = (p) => Math.hypot(p[0] - CROSS[0], p[1] - CROSS[1]) < 70;
let pts = spline(GUIDE, N);
let widths = pts.map(() => 0);
for (let pass = 0; pass < 4; pass++) {
  const nrm = normals(pts);
  pts = pts.map((p, i) => {
    if (nearCross(p)) return p;
    const r = run(p, nrm[i]);
    if (!r) return p;
    widths[i] = r[1] - r[0];
    const mid = (r[0] + r[1]) / 2;
    return [p[0] + nrm[i][0] * mid, p[1] + nrm[i][1] * mid];
  });
  pts = smooth(pts, 2);
}

// Through the crossing the strands merge, so position, width and colour are bridged straight
// across it from either side. Colour reaches further out: right at the edge of the crossing the
// other strand still bleeds into the samples.
const zonesWithin = (radius) => {
  const zones = [];
  pts.forEach((p, i) => {
    if (Math.hypot(p[0] - CROSS[0], p[1] - CROSS[1]) >= radius) return;
    const z = zones[zones.length - 1];
    if (z && i === z[1] + 1) z[1] = i;
    else zones.push([i, i]);
  });
  return zones;
};
const bridge = (arr, zones) => {
  const out = arr.slice();
  for (const [a, b] of zones) {
    const lo = Math.max(0, a - 1);
    const hi = Math.min(arr.length - 1, b + 1);
    for (let i = a; i <= b; i++) {
      const f = (i - lo) / (hi - lo);
      out[i] = Array.isArray(arr[lo]) ? arr[lo].map((v, d) => v + (arr[hi][d] - v) * f) : arr[lo] + (arr[hi] - arr[lo]) * f;
    }
  }
  return out;
};
const zones = zonesWithin(70);
pts = smooth(bridge(pts, zones), 3);

const nrm = normals(pts);
let colours = pts.map((p, i) => {
  const half = Math.max(2, widths[i] * 0.3);
  const samples = [];
  for (let d = -half; d <= half; d += 1) {
    const c = colourAt(p[0] + nrm[i][0] * d, p[1] + nrm[i][1] * d);
    // Skip the near-white glints the JPEG left along thin edges; they aren't ribbon colour
    if (c && !(Math.min(...c) > 165 && Math.max(...c) - Math.min(...c) < 100)) samples.push(c);
  }
  if (!samples.length) return null;
  return [0, 1, 2].map((k) => samples.map((s) => s[k]).sort((a, b) => a - b)[samples.length >> 1]);
});
// Fill gaps (tips, crossing) from the nearest measured neighbour
colours = colours.map((c, i) => {
  if (c) return c;
  for (let d = 1; d < N; d++) for (const j of [i - d, i + d]) if (colours[j]) return colours[j];
  return [128, 128, 128];
});
widths = smooth(bridge(widths, zones), 3);
colours = smooth(bridge(colours, zonesWithin(100)), 5); // soft blends, like the logo's gradient

// Normalise: symbol width = 1, origin at the symbol's centre, y up
const toUnit = ([x, y]) => [+(x / BW - 0.5).toFixed(4), +((BH / 2 - y) / BW).toFixed(4)];
const hex = (c) => "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
const data = {
  source: "public/brand/pink-knots-logo.png",
  aspect: +(BW / BH).toFixed(3),
  // Sample indices where the ribbon passes the crossing: over (magenta diagonal) then under (green)
  crossing: zones.map(([a, b]) => Math.round((a + b) / 2)),
  points: pts.map(toUnit),
  widths: widths.map((w) => +(w / BW).toFixed(4)),
  colours: colours.map(hex),
};
writeFileSync(OUT, JSON.stringify(data) + "\n");
console.log(`logo-ribbon.json: ${N} samples, crossings at ${data.crossing}, widths ${Math.min(...data.widths)}–${Math.max(...data.widths)}`);
