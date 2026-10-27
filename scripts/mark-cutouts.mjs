// Finds card photos shot on a plain white backdrop (product cut-outs) and writes their slugs to
// src/data/cutouts.json. Cards show cut-outs on the lilac mat and scene photos full-bleed.
// Re-run after fetch-images.mjs.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const images = JSON.parse(readFileSync(new URL("../src/data/images.json", import.meta.url), "utf8"));
const OUT = new URL("../src/data/cutouts.json", import.meta.url);
const N = 40; // sample grid
const NEAR_WHITE = 232; // every channel at least this
const SHARE = 0.9; // of the border ring

async function isCutout(file) {
  const { data, info } = await sharp(fileURLToPath(new URL(`../public${file}`, import.meta.url)))
    .flatten({ background: "#ffffff" })
    .resize(N, N, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  let white = 0;
  let total = 0;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (x > 0 && y > 0 && x < N - 1 && y < N - 1) continue;
      const i = (y * N + x) * info.channels;
      total++;
      if (data[i] >= NEAR_WHITE && data[i + 1] >= NEAR_WHITE && data[i + 2] >= NEAR_WHITE) white++;
    }
  }
  return white / total >= SHARE;
}

const slugs = [];
for (const [slug, entry] of Object.entries(images)) {
  if (entry.card && (await isCutout(entry.card))) slugs.push(slug);
}
writeFileSync(OUT, JSON.stringify(slugs.sort(), null, 1) + "\n");
console.log(`${slugs.length} of ${Object.keys(images).length} card photos are cut-outs`);
