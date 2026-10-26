import type { MetadataRoute } from "next";
import { collections, products } from "@/lib/catalogue";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/collections", "/about", "/contact"].map((p) => ({ url: `${site.url}${p}` }));
  return [
    ...pages,
    ...collections.map((c) => ({ url: `${site.url}/collections/${c.slug}` })),
    ...products.map((p) => ({ url: `${site.url}/products/${p.slug}` })),
  ];
}
