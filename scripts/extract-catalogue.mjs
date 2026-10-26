// Parses pink-knots-site-content.md (the scraped catalogue) into src/data/catalogue.json.
// The Markdown file is the source of truth; this script never edits it.
import { readFileSync, writeFileSync } from "node:fs";

const SRC = new URL("../pink-knots-site-content.md", import.meta.url);
const OUT = new URL("../src/data/catalogue.json", import.meta.url);
const PLACEHOLDER = "tdw.imimg.com/template-tdw";

// Six top-level collections, as proposed in section 11 of the content file.
// Keys are the category page slugs from the original site.
const COLLECTIONS = [
  {
    slug: "wedding",
    name: "Wedding",
    blurb: "Invite hampers, trousseau packing and keepsake boxes made to match the wedding.",
    categories: [
      "designer-wedding-boxes", "gift-hampers-and-wedding-gifts", "raisin-wedding-boxes", "wedding-invitation-box",
      "wedding-invitations", "luxury-wedding-invitations", "trousseau-packing-services", "wedding-gift",
    ],
  },
  {
    slug: "festive",
    name: "Festive & Diwali",
    blurb: "Printed trays, hamper boxes and platters for Diwali and the festive season.",
    categories: [
      "cardboard-festive-boxes", "wooden-gift-boxes-for-diwali", "designer-tray-for-diwali-gifting",
      "diwali-wooden-printed-trays-gift", "festival-gift-packaging-serving-platter",
    ],
  },
  {
    slug: "corporate",
    name: "Corporate Gifting",
    blurb: "Logo-printed boxes, leatherette sets, watch boxes and desk pieces for teams and clients.",
    categories: [
      "corporate-gifting-box", "corporate-gifting", "corporate-gift-wooden-box", "leatherette-item-gift-packaging",
      "gift-sets", "watch-box", "canvas-packaging-gifting-items", "corporate-diary", "promotional-gifts",
      "promotional-stand", "beach-flags",
    ],
  },
  {
    slug: "trays",
    name: "Trays & Serveware",
    blurb: "Wooden and MDF trays, platters, coasters and cutlery trays, printed to order.",
    categories: [
      "designer-wooden-tray-for-gift-packaging", "wooden-trays-for-packaging", "wooden-cutlery-trays",
      "mdf-wood-digital-coasters", "cheese-platter", "napkin-ring", "wooden-chopping-board", "wall-plates",
    ],
  },
  {
    slug: "boxes",
    name: "Boxes & Packaging",
    blurb: "Rigid, cardboard, MDF and jewellery boxes in any size, finish and print.",
    categories: [
      "chocolate-boxes-for-packaging", "wooden-box", "wooden-box-and-wooden-tray", "mdf-digital-printed-packaging-items",
      "rigid-boxes", "decorative-box", "pvc-wooden-gift-boxes", "sweet-packaging-box", "cardboard-folding-boxes",
      "jewelry-box", "earring-jewelry-box", "plastic-jewelry-box", "gift-packaging-holders", "handicraft-basket",
    ],
  },
  {
    slug: "hospitality",
    name: "Hotel, Home & Office",
    blurb: "Tissue boxes, room trays, organisers and key holders for hotels, homes and desks.",
    categories: [
      "hotel-utility-items", "wooden-tissue-boxes", "digital-tissue-boxes", "customized-facial-tissues-boxes",
      "wooden-key-holders", "office-organizer", "wooden-photo-frames",
    ],
  },
];

const md = readFileSync(SRC, "utf8").replace(/\r\n/g, "\n");
const body = md.slice(md.indexOf("## 10. Product catalogue — full details"), md.indexOf("## 11. Notes for the rebuild"));
const categoryChunks = body.split(/\n(?=### 10\.\d+ )/).slice(1);

const tidy = (s) => s.replace(/[ \t]+$/gm, "").replace(/\n{3,}/g, "\n\n").trim();
const paragraphs = (s) => tidy(s).split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

const categories = [];
const products = [];
const usedSlugs = new Set();

for (const chunk of categoryChunks) {
  const [head, ...productChunks] = chunk.split(/\n(?=#### \d+\.\d+ )/);
  const name = head.match(/^### 10\.\d+ (.+)$/m)[1].trim();
  const pageUrl = head.match(/\*Page:\* (\S+)/)[1];
  const slug = pageUrl.split("/").pop().replace(/\.html$/, "");
  const metaDescription = head.match(/\*Meta description:\* (.+)/)?.[1].trim() ?? "";
  const intro = paragraphs(head.split(/\*Meta description:\*.*\n/)[1] ?? "")
    .map((p) => p.replace(/^-\s+/gm, "").trim())
    .filter((p) => !p.startsWith("---"));

  const collection = COLLECTIONS.find((c) => c.categories.includes(slug));
  if (!collection) throw new Error(`Category ${slug} is not mapped to a collection`);

  const category = { slug, name, collection: collection.slug, intro, metaDescription, products: [] };

  for (const pc of productChunks) {
    const pName = pc.match(/^#### \d+\.\d+ (.+)$/m)[1].trim();
    const priceRaw = pc.match(/- \*\*Price:\*\* (.+)/)?.[1].trim() ?? "Ask for price";
    const priceMatch = priceRaw.match(/₹\s*([\d,]+(?:\.\d+)?)\s*(?:\/\s*(.+))?/);
    const link = pc.match(/- \*\*Link:\*\* (\S+)/)?.[1] ?? "";
    const anchor = link.split("#")[1] || pName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const itemCode = pc.match(/- \*\*Item Code:\*\* (.+)/)?.[1].trim() ?? null;
    const deliveryTime = pc.match(/- \*\*Delivery Time:\*\* (.+)/)?.[1].trim() ?? null;

    const specs = [];
    for (const m of pc.matchAll(/^\| (.+?) \| (.+?) \|$/gm)) {
      if (m[1] === "Specification" || m[1].startsWith("---")) continue;
      specs.push({ label: m[1].trim(), value: m[2].trim() });
    }

    const afterTable = pc.split("\n").filter((l) => !/^(\||- \*\*|#### )/.test(l)).join("\n");
    const descRaw = afterTable.split("**Images:**")[0];
    const description = paragraphs(descRaw).filter((p) => !p.startsWith("*No details published"));

    const imagesBlock = pc.split("**Images:**")[1] ?? "";
    const images = [...imagesBlock.matchAll(/^- (https?:\/\/\S+)/gm)].map((m) => m[1]).filter((u) => !u.includes(PLACEHOLDER));

    let pSlug = anchor;
    if (usedSlugs.has(pSlug)) pSlug = `${anchor}-${slug}`;
    for (let i = 2; usedSlugs.has(pSlug); i++) pSlug = `${anchor}-${slug}-${i}`;
    usedSlugs.add(pSlug);

    const moqSpec = specs.find((s) => s.label === "Minimum Order Quantity")?.value ?? null;

    products.push({
      slug: pSlug,
      name: pName,
      category: slug,
      collection: collection.slug,
      price: priceMatch ? Number(priceMatch[1].replace(/,/g, "")) : null,
      priceUnit: priceMatch?.[2]?.trim() ?? null,
      itemCode,
      deliveryTime,
      moq: moqSpec,
      specs,
      description,
      sourceImages: images,
    });
    category.products.push(pSlug);
  }
  categories.push(category);
}

const collections = COLLECTIONS.map(({ categories: cats, ...c }) => ({
  ...c,
  categories: cats.filter((s) => categories.some((x) => x.slug === s)),
}));

writeFileSync(OUT, JSON.stringify({ collections, categories, products }, null, 1));
console.log(`${collections.length} collections · ${categories.length} categories · ${products.length} products`);
console.log(`${products.filter((p) => p.price == null).length} without price · ${products.filter((p) => !p.sourceImages.length).length} without images`);
