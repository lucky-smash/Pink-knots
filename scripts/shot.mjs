// Visual QA: node scripts/shot.mjs <path> [width] [height] [scrollFraction...]
// Captures viewport screenshots into .shots/ using the system Chrome/Edge.
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const [path = "/", w = "1440", h = "900", ...scrolls] = process.argv.slice(2);
const base = process.env.BASE_URL ?? "http://localhost:3000";
mkdirSync(".shots", { recursive: true });

let browser;
for (const channel of ["chrome", "msedge"]) {
  try {
    browser = await chromium.launch({ channel, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
    break;
  } catch {}
}
if (!browser) throw new Error("No Chrome or Edge found");

const page = await browser.newPage({ viewport: { width: +w, height: +h }, reducedMotion: process.env.REDUCED ? "reduce" : "no-preference" });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await page.goto(base + path, { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(1500);

const name = (path.replace(/\W+/g, "_") || "home") + `_${w}`;
const fractions = scrolls.length ? scrolls.map(Number) : [null];
for (const f of fractions) {
  if (f != null) {
    await page.evaluate((f) => {
      const total = document.documentElement.scrollHeight - innerHeight;
      window.scrollTo(0, f > 1 ? f : total * f);
    }, f);
    await page.waitForTimeout(Number(process.env.WAIT ?? 1400));
  }
  const file = `.shots/${name}${f != null ? `_${f}` : ""}.png`;
  await page.screenshot({ path: file, fullPage: f == null && process.env.FULL === "1" });
  console.log(file);
}
if (errors.length) console.log("ERRORS:\n" + errors.join("\n"));
await browser.close();
