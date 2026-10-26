import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone } from "@/components/Icons";
import { Breadcrumbs } from "@/components/PageIntro";
import { ProductCard } from "@/components/ProductCard";
import { ProductGallery } from "@/components/ProductGallery";
import { KnotMark } from "@/components/Wordmark";
import { AddToQuoteButton } from "@/components/quote/AddToQuoteButton";
import {
  cardImage, formatPrice, galleryImages, getCategory, getCollection, getProduct, moqLabel, moqNumber, products, productsInCategory, productsInCollection,
} from "@/lib/catalogue";
import { site } from "@/lib/site";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const p = getProduct((await params).slug);
  if (!p) return {};
  const img = cardImage(p);
  const summary = p.description[0]?.split("\n")[0].slice(0, 150);
  return {
    title: p.name,
    description: summary ? `${summary}…` : `${p.name} by Pink Knots, New Delhi — custom gift packaging made to order.`,
    openGraph: img ? { images: [img] } : undefined,
  };
}

export default async function ProductPage({ params }: Params) {
  const product = getProduct((await params).slug);
  if (!product) notFound();

  const category = getCategory(product.category)!;
  const collection = getCollection(product.collection)!;
  const images = galleryImages(product);
  const moq = moqLabel(product);
  // Specs shown in the summary list are not repeated in the table.
  const specs = product.specs.filter((s) => s.label !== "Minimum Order Quantity");
  const sameCategory = productsInCategory(product.category).filter((p) => p.slug !== product.slug);
  const related = (sameCategory.length >= 4 ? sameCategory : [...sameCategory, ...productsInCollection(product.collection).filter((p) => p.slug !== product.slug && p.category !== product.category)])
    .filter((p) => cardImage(p))
    .slice(0, 4);

  const facts = [
    moq && { k: "Minimum order", v: moq },
    product.deliveryTime && { k: "Delivery", v: product.deliveryTime },
    product.itemCode && { k: "Item code", v: product.itemCode },
  ].filter(Boolean) as { k: string; v: string }[];

  return (
    <>
      <div className="container-page pt-8 md:pt-10">
        <Breadcrumbs
          items={[
            { href: "/collections", label: "Collections" },
            { href: `/collections/${collection.slug}`, label: collection.name },
            { href: `/collections/${collection.slug}?category=${category.slug}`, label: category.name },
            { href: `/products/${product.slug}`, label: product.name },
          ]}
        />
      </div>

      <section className="container-page grid gap-10 pt-8 pb-16 md:pt-10 lg:grid-cols-12 lg:gap-14 lg:pb-24">
        <div className="lg:col-span-7">
          {images.length ? (
            <ProductGallery images={images} name={product.name} />
          ) : (
            <div className="grid aspect-square place-items-center rounded-[var(--radius-card)] border border-line bg-kraft/40">
              <div className="text-center">
                <KnotMark className="mx-auto h-16 w-16 opacity-50" />
                <p className="mt-3 text-sm text-stone">Photos available on request</p>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <p className="text-xs font-semibold tracking-[0.14em] text-knot uppercase">
              <Link href={`/collections/${collection.slug}?category=${category.slug}`} className="link-draw">{category.name}</Link>
            </p>
            <h1 className="mt-3 text-title font-bold">{product.name}</h1>

            <div className="mt-6 flex items-baseline gap-3">
              {product.price != null ? (
                <>
                  <span className="font-display text-[2rem] leading-none font-bold tracking-[-0.03em] tabular-nums">{formatPrice(product.price)}</span>
                  <span className="text-stone">/ {(product.priceUnit ?? "piece").toLowerCase()} · approx.</span>
                </>
              ) : (
                <span className="font-display text-2xl font-semibold">Price on request</span>
              )}
            </div>
            <p className="mt-2 text-sm text-stone">Final price depends on size, quantity and customisation.</p>

            {facts.length > 0 && (
              <dl
                className="mt-7 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line"
                style={{ gridTemplateColumns: `repeat(${facts.length}, minmax(0, 1fr))` }}
              >
                {facts.map((f) => (
                  <div key={f.k} className="bg-paper px-4 py-3.5">
                    <dt className="text-xs text-stone">{f.k}</dt>
                    <dd className="mt-1 font-semibold">{f.v}</dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="mt-8">
              <AddToQuoteButton slug={product.slug} name={product.name} defaultQty={moqNumber(product) ?? 50} />
            </div>
            <a href={site.phone.href} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-ink-soft hover:text-knot">
              <Phone size={16} /> Prefer to talk? Call {site.phone.display}
            </a>

            {specs.length > 0 && (
              <div className="mt-10">
                <h2 className="text-lg font-semibold tracking-[-0.01em]">Specifications</h2>
                <table className="mt-3 w-full text-[0.9375rem]">
                  <tbody className="divide-y divide-line border-y border-line">
                    {specs.map((s) => (
                      <tr key={s.label}>
                        <th scope="row" className="w-2/5 py-2.5 pr-4 text-left align-top font-normal text-stone">{s.label}</th>
                        <td className="py-2.5 align-top text-ink">{s.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {product.description.length > 0 && (
              <div className="mt-10">
                <h2 className="text-lg font-semibold tracking-[-0.01em]">About this piece</h2>
                <div className="mt-3 space-y-4 text-[0.9375rem] leading-relaxed whitespace-pre-line text-ink-soft">
                  {product.description.map((d, i) => <p key={i}>{d}</p>)}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="border-t border-line bg-paper">
          <div className="container-page py-16 md:py-20">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="related-title" className="text-title font-bold">You might also consider</h2>
              <Link href={`/collections/${collection.slug}`} className="link-draw font-semibold text-knot">All {collection.name}</Link>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 lg:gap-x-6">
              {related.map((p) => <ProductCard key={p.slug} product={p} />)}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
