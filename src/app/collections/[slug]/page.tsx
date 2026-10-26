import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CollectionBrowser } from "@/components/CollectionBrowser";
import { ArrowRight } from "@/components/Icons";
import { PageIntro } from "@/components/PageIntro";
import { ProductCard } from "@/components/ProductCard";
import { collections, formatPrice, fromPrice, getCategory, getCollection, productsInCollection } from "@/lib/catalogue";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return collections.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const c = getCollection((await params).slug);
  if (!c) return {};
  return { title: `${c.name} gift packaging`, description: `${c.blurb} ${productsInCollection(c.slug).length} designs, made to order by Pink Knots in New Delhi.` };
}

export default async function CollectionPage({ params }: Params) {
  const collection = getCollection((await params).slug);
  if (!collection) notFound();

  const list = productsInCollection(collection.slug);
  const from = fromPrice(list);
  const cats = collection.categories.map((s) => getCategory(s)!).map((c) => ({ slug: c.slug, name: c.name, count: c.products.length, intro: c.intro }));
  const others = collections.filter((c) => c.slug !== collection.slug);

  return (
    <>
      <PageIntro
        eyebrow={`Collection · ${list.length} designs`}
        title={collection.name}
        crumbs={[{ href: "/", label: "Home" }, { href: "/collections", label: "Collections" }, { href: `/collections/${collection.slug}`, label: collection.name }]}
        aside={
          from != null && (
            <p className="text-sm text-stone">
              From <span className="font-display text-3xl font-bold tracking-[-0.03em] text-ink">{formatPrice(from)}</span> per piece
            </p>
          )
        }
      >
        {collection.blurb}
      </PageIntro>

      <section className="container-page pb-20 md:pb-28" aria-label={`${collection.name} products`}>
        <CollectionBrowser
          categories={cats}
          items={list.map((p, i) => ({ slug: p.slug, category: p.category, price: p.price, card: <ProductCard product={p} priority={i < 4} /> }))}
        />
      </section>

      <section aria-labelledby="more-title" className="border-t border-line bg-paper">
        <div className="container-page py-14 md:py-16">
          <h2 id="more-title" className="text-xl font-semibold tracking-[-0.015em]">More collections</h2>
          <ul className="mt-6 flex flex-wrap gap-3">
            {others.map((c) => (
              <li key={c.slug}>
                <Link href={`/collections/${c.slug}`} className="btn btn-outline btn-sm">
                  {c.name} <ArrowRight size={16} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
