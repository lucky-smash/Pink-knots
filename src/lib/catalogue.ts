import data from "@/data/catalogue.json";
import imageMap from "@/data/images.json";

export type Spec = { label: string; value: string };

export type Product = {
  slug: string;
  name: string;
  category: string;
  collection: string;
  price: number | null;
  priceUnit: string | null;
  itemCode: string | null;
  deliveryTime: string | null;
  moq: string | null;
  specs: Spec[];
  description: string[];
  sourceImages: string[];
};

export type Category = {
  slug: string;
  name: string;
  collection: string;
  intro: string[];
  metaDescription: string;
  products: string[];
};

export type Collection = {
  slug: string;
  name: string;
  blurb: string;
  categories: string[];
};

type ImageEntry = { card: string; gallery: string[] };

export const collections = data.collections as Collection[];
export const categories = data.categories as Category[];
export const products = data.products as Product[];

const images = imageMap as Record<string, ImageEntry>;
const productBySlug = new Map(products.map((p) => [p.slug, p]));
const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));

export const getProduct = (slug: string) => productBySlug.get(slug);
export const getCategory = (slug: string) => categoryBySlug.get(slug);
export const getCollection = (slug: string) => collections.find((c) => c.slug === slug);

export const productsInCollection = (slug: string) => products.filter((p) => p.collection === slug);
export const productsInCategory = (slug: string) => products.filter((p) => p.category === slug);

export const cardImage = (p: Product) => images[p.slug]?.card ?? null;
export const galleryImages = (p: Product) => images[p.slug]?.gallery ?? [];

/** The lowest documented price in a set of products, for "from ₹…" labels. */
export const fromPrice = (list: Product[]) => {
  const prices = list.map((p) => p.price).filter((n): n is number => n != null);
  return prices.length ? Math.min(...prices) : null;
};

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
export const formatPrice = (n: number) => inr.format(n);

export const priceLabel = (p: Product) =>
  p.price == null ? "Price on request" : `${formatPrice(p.price)} / ${(p.priceUnit ?? "piece").toLowerCase()}`;

/** MOQ as documented: the spec table first, then the "MOQ- 100pcs" lines some descriptions carry. */
export const moqLabel = (p: Product) => {
  if (p.moq) return p.moq.replace(/Piece$/i, "pcs").replace(/Pieces$/i, "pcs");
  const m = p.description.join("\n").match(/MOQ\s*[-:]\s*(\d+)\s*(pcs|pieces)?/i);
  return m ? `${m[1]} pcs` : null;
};

/** Numeric MOQ for the quote list's default quantity. */
export const moqNumber = (p: Product) => {
  const m = moqLabel(p)?.match(/\d[\d,]*/);
  return m ? Number(m[0].replace(/,/g, "")) : null;
};

/** Products the original home page featured (section 8 of the content file), matched by name. */
const FEATURED_NAMES = [
  "Printed Wedding Boxes",
  "Designer Wooden Tray",
  "Decorative Wooden Trays",
  "Wooden Serving Tray",
  "Designer Wedding Invite Hampers",
  "Designer Wooden Serving Tray Set",
  "Wedding Gift Boxes",
  "Festival Gift Pack Box",
];

export const featuredProducts = () =>
  FEATURED_NAMES.map((name) => products.find((p) => p.name.toLowerCase() === name.toLowerCase() && cardImage(p)))
    .filter((p): p is Product => Boolean(p));

/** A representative photo for a collection: the first product with an image. */
export const collectionCover = (slug: string) => {
  const p = productsInCollection(slug).find((x) => cardImage(x));
  return p ? { src: cardImage(p)!, alt: p.name } : null;
};
