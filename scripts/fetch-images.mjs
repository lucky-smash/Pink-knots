// Downloads product photos from the IndiaMART CDN listed in the catalogue and stores
// them locally as WebP: a 480px card image plus up to three 960px gallery images.
// Writes src/data/images.json mapping product slug -> local paths. Safe to re-run.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import sharp from "sharp";

const catalogue = JSON.parse(readFileSync(new URL("../src/data/catalogue.json", import.meta.url), "utf8"));
const OUT_DIR = new URL("../public/products/", import.meta.url);
const MAP = new URL("../src/data/images.json", import.meta.url);
const GALLERY_MAX = 3;
const CONCURRENCY = 8;

mkdirSync(OUT_DIR, { recursive: true });

async function download(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      if (attempt === 3) throw err;
      await new Promise((r) => setTimeout(r, 800 * attempt));
    }
  }
}

async function save(buf, file, width) {
  const path = new URL(file, OUT_DIR);
  if (existsSync(path)) return true;
  // White-flatten: many source photos are PNGs on transparent backgrounds.
  await sharp(buf).flatten({ background: "#ffffff" })
    .resize({ width, height: width, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 78 }).toFile(path.pathname.replace(/^\/([A-Za-z]:)/, "$1"));
  return true;
}

const jobs = catalogue.products.filter((p) => p.sourceImages.length);
const result = {};
let done = 0;
let failed = 0;

async function processProduct(p) {
  const gallery = [];
  for (const [i, url] of p.sourceImages.slice(0, GALLERY_MAX).entries()) {
    const file = `${p.slug}-${i + 1}.webp`;
    try {
      const needCard = i === 0 && !existsSync(new URL(`${p.slug}.webp`, OUT_DIR));
      const needFull = !existsSync(new URL(file, OUT_DIR));
      if (needCard || needFull) {
        const buf = await download(url);
        if (needCard) await save(buf, `${p.slug}.webp`, 480);
        if (needFull) await save(buf, file, 960);
      }
      gallery.push(`/products/${file}`);
    } catch (err) {
      failed++;
      console.warn(`! ${p.slug} image ${i + 1}: ${err.message}`);
    }
  }
  if (gallery.length) {
    const card = existsSync(new URL(`${p.slug}.webp`, OUT_DIR)) ? `/products/${p.slug}.webp` : gallery[0];
    result[p.slug] = { card, gallery };
  }
  if (++done % 25 === 0) console.log(`${done}/${jobs.length}`);
}

const queue = [...jobs];
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (queue.length) await processProduct(queue.shift());
}));

writeFileSync(MAP, JSON.stringify(result, null, 1));
console.log(`done: ${Object.keys(result).length} products with images, ${failed} failed downloads`);
