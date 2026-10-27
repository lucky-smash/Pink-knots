// Interaction checks against a running server: node scripts/behaviour.mjs
import { chromium } from "playwright-core";

const base = process.env.BASE_URL ?? "http://localhost:3000";
let browser;
for (const channel of ["chrome", "msedge"]) {
  try { browser = await chromium.launch({ channel }); break; } catch {}
}
const results = [];
const check = (name, ok, extra = "") => results.push(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? ` — ${extra}` : ""}`);
const errors = [];

const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on("pageerror", (e) => errors.push(e.message));

// 1. Collections dropdown survives diagonal pointer travel, closes on Escape
await page.goto(base + "/collections", { waitUntil: "networkidle" });
await page.waitForTimeout(1500); // let React hydrate before pointer events
const trigger = page.getByRole("button", { name: "Collections" });
await trigger.hover();
await page.waitForTimeout(100);
check("dropdown opens on hover", await page.locator("#collections-menu").isVisible());
const box = await trigger.boundingBox();
await page.mouse.move(box.x + box.width + 120, box.y + box.height + 40, { steps: 6 }); // diagonal into the panel
await page.waitForTimeout(300);
check("dropdown stays open moving into panel", await page.locator("#collections-menu").isVisible());
await page.keyboard.press("Escape");
await page.waitForTimeout(50);
check("Escape closes dropdown", !(await page.locator("#collections-menu").isVisible()));
await trigger.focus();
await page.keyboard.press("Enter");
check("keyboard Enter opens dropdown", await page.locator("#collections-menu").isVisible());
await page.keyboard.press("Escape");

// 2. Category filter + URL sync
await page.goto(base + "/collections/corporate", { waitUntil: "networkidle" });
const all = await page.locator("main ul.grid > li").count();
await page.getByRole("button", { name: /^Watch Box/ }).click();
const filtered = await page.locator("main ul.grid > li").count();
check("category filter narrows grid", filtered > 0 && filtered < all, `${all} → ${filtered}`);
check("filter writes ?category=", page.url().includes("category=watch-box"));
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(1000); // filter applies after hydration
check("filter restored from URL", (await page.locator("main ul.grid > li").count()) === filtered);

// 3. Quote list: add from card, badge count, persists to contact page
await page.goto(base + "/collections/wedding", { waitUntil: "networkidle" });
const adds = page.getByRole("button", { name: /^Add .* to quote list$/ });
await adds.nth(0).click();
await adds.nth(0).click(); // list shifts: the first button is now the second product
const badge = await page.getByLabel(/items in quote list/).textContent();
check("header badge counts quote items", badge?.trim() === "2", `badge=${badge}`);
await page.goto(base + "/contact#quote", { waitUntil: "networkidle" });
// The list is read from localStorage after hydration, which is slow on the dev server
await page.locator("#quote fieldset ul > li").nth(1).waitFor({ timeout: 8000 }).catch(() => {});
const rows = await page.locator("#quote fieldset ul > li").count();
check("quote list persists to contact page", rows === 2, `rows=${rows}`);

// 4. Form validation then summary
await page.getByRole("button", { name: "Prepare enquiry" }).click();
const nameInvalid = await page.locator("#q-name").getAttribute("aria-invalid");
check("empty submit flags required fields", nameInvalid === "true");
check("focus moves to first invalid field", await page.evaluate(() => document.activeElement?.id === "q-name"));
await page.fill("#q-name", "Test Buyer");
await page.fill("#q-phone", "98100 00000");
await page.getByText("Corporate gifting", { exact: true }).click();
await page.getByRole("button", { name: "Prepare enquiry" }).click();
const summary = await page.locator("#quote-summary pre").textContent().catch(() => "");
check("summary lists contact + products", /Test Buyer/.test(summary) && /Products:/.test(summary) && /Occasion: Corporate gifting/.test(summary));

// 5. Product page add/remove toggles
await page.goto(base + "/products/corporate-tea-gift-box", { waitUntil: "networkidle" });
const mainBtn = page.getByRole("button", { name: /quote list/ }).first();
const before = await mainBtn.textContent();
await mainBtn.click();
const after = await mainBtn.textContent();
check("product page quote toggle", before !== after, `${before?.trim()} → ${after?.trim()}`);

// 6. 404
const res = await page.goto(base + "/products/does-not-exist");
check("unknown product returns 404", res?.status() === 404);

// 7. Reduced motion: hero is a single static screen, not a scroll story
const rm = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const rp = await rm.newPage();
await rp.goto(base + "/", { waitUntil: "networkidle" });
await rp.waitForTimeout(800);
const heroH = await rp.locator("section[aria-label=Introduction]").evaluate((el) => el.offsetHeight);
check("reduced motion: no scroll-jacked hero", heroH < 1000, `hero height ${heroH}px`);
check("reduced motion: headline visible", await rp.getByRole("heading", { level: 1 }).isVisible());

// 8. Mobile menu
const mob = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
const mp = await mob.newPage();
await mp.goto(base + "/about", { waitUntil: "networkidle" });
await mp.getByRole("button", { name: "Open menu" }).tap();
await mp.waitForTimeout(400);
check("mobile menu opens", await mp.locator("#mobile-menu").isVisible());
await mp.locator("#mobile-menu").getByRole("link", { name: /^Trays & Serveware/ }).tap();
await mp.waitForURL(/collections\/trays/);
await mp.waitForTimeout(400);
check("mobile menu navigates and closes", !(await mp.locator("#mobile-menu").isVisible()));
const overflow = await mp.evaluate(() => document.documentElement.scrollWidth > innerWidth);
check("no horizontal overflow at 390px", !overflow);

console.log(results.join("\n"));
if (errors.length) console.log("PAGE ERRORS:\n" + errors.join("\n"));
await browser.close();
