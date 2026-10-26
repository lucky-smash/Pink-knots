import type { Metadata } from "next";
import Link from "next/link";
import { CollectionCard } from "@/components/CollectionCard";
import { PageIntro } from "@/components/PageIntro";
import { Reveal } from "@/components/Reveal";
import { collections, getCategory, products } from "@/lib/catalogue";

export const metadata: Metadata = {
  title: "Collections",
  description: `Browse ${products.length} custom gift packaging designs — wedding, festive & Diwali, corporate gifting, trays, boxes and hospitality pieces, made to order in New Delhi.`,
};

export default function CollectionsPage() {
  return (
    <>
      <PageIntro
        eyebrow="Collections"
        title={<>Every design, <span className="accent text-knot">made to order.</span></>}
        crumbs={[{ href: "/", label: "Home" }, { href: "/collections", label: "Collections" }]}
      >
        {products.length} pieces across six collections. Each can be customised in size, colour, print and finish.
      </PageIntro>

      <section aria-label="Collections" className="container-page py-14 md:py-20">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {collections.map((c, i) => (
            <Reveal as="li" key={c.slug} delay={(i % 3) * 80}>
              <CollectionCard collection={c} index={i} />
            </Reveal>
          ))}
        </ul>
      </section>

      <section aria-labelledby="index-title" className="border-t border-line bg-paper">
        <div className="container-page py-14 md:py-20">
          <h2 id="index-title" className="text-title font-bold">Browse by category</h2>
          <div className="mt-10 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((c) => (
              <div key={c.slug}>
                <h3 className="text-sm font-semibold tracking-[0.14em] text-knot uppercase">
                  <Link href={`/collections/${c.slug}`} className="link-draw">{c.name}</Link>
                </h3>
                <ul className="mt-3 divide-y divide-line border-t border-line">
                  {c.categories.map((slug) => {
                    const cat = getCategory(slug)!;
                    return (
                      <li key={slug}>
                        <Link href={`/collections/${c.slug}?category=${slug}`} className="group flex items-baseline justify-between gap-4 py-2.5 text-[0.9375rem]">
                          <span className="text-ink-soft group-hover:text-knot">{cat.name}</span>
                          <span className="text-xs text-stone tabular-nums">{cat.products.length}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
