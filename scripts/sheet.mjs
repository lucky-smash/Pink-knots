// Combines screenshots into one contact sheet: node scripts/sheet.mjs out.png a.png b.png ...
import sharp from "sharp";
const [out, ...files] = process.argv.slice(2);
const W = 720, cols = 2;
const imgs = await Promise.all(files.map((f) => sharp(f).resize({ width: W }).toBuffer({ resolveWithObject: true })));
const H = Math.max(...imgs.map((i) => i.info.height));
const rows = Math.ceil(imgs.length / cols);
await sharp({ create: { width: W * cols + 10 * (cols - 1), height: H * rows + 10 * (rows - 1), channels: 3, background: "#888" } })
  .composite(imgs.map((i, k) => ({ input: i.data, left: (k % cols) * (W + 10), top: Math.floor(k / cols) * (H + 10) })))
  .png().toFile(out);
console.log(out);
