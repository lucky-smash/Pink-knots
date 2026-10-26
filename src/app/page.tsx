import Image from "next/image";
import Link from "next/link";
import { CollectionCard } from "@/components/CollectionCard";
import { ArrowRight, Phone } from "@/components/Icons";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { EngravedKnot } from "@/components/EngravedKnot";
import { GiftHero } from "@/components/home/GiftHero";
import { cardImage, collections, featuredProducts, getProduct, products } from "@/lib/catalogue";
import { site } from "@/lib/site";

// Material photos, chosen from the catalogue so each shows the real finish.
const MATERIALS = [
  { title: "Wood & MDF", body: "Polished, lacquered or digitally printed boxes, trays and platters.", slug: "designer-wooden-tray" },
  { title: "Kraft & rigid board", body: "Hamper and festive boxes with foil stamping, embossing or offset print.", slug: "festive-cardboard-gift-box" },
  { title: "Leatherette", body: "Trays, tissue boxes, pen stands and menu folders for hotels and offices.", slug: "leatherette-serving-tray" },
  { title: "Canvas", body: "Printed canvas baskets and totes for gift sets and events.", slug: "printed-canvas-basket" },
];

const STEPS = [
  { title: "Pick a starting point", body: `Browse ${products.length} designs across six collections, or describe something new.` },
  { title: "Make it yours", body: "Choose the size, colour, print and finish, and add your logo or names." },
  { title: "Confirm the order", body: "Most pieces start at a minimum of 50. We confirm specs, quantity and price with you." },
  { title: "Made and delivered", body: "Made to order in New Delhi — typically in two to three weeks, depending on the piece." },
];

export default function HomePage() {
  const featured = featuredProducts();

  return (
    <>
      <GiftHero productCount={products.length} collectionCount={collections.length} />

      {/* Inside the box: begins in the same Knot Red the hero ends on */}
      <section id="inside" aria-labelledby="inside-title" className="relative overflow-hidden bg-knot text-paper">
        <EngravedKnot tone="knot" className="top-6 -right-[22%] w-[min(1150px,120vw)] md:-right-[8%]" />
        <EngravedKnot tone="knot" flip="x" className="top-[46%] -left-[40%] w-[min(900px,110vw)] md:-left-[14%]" />
        <EngravedKnot tone="knot" flip="y" className="-right-[10%] -bottom-[4%] hidden w-[min(560px,40vw)] lg:block" />
        <div className="relative container-page pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="grid gap-6 md:grid-cols-12 md:items-end">
            <Reveal className="md:col-span-7">
              <p className="eyebrow eyebrow-on-dark">Inside every box</p>
              <h2 id="inside-title" className="mt-4 text-display font-bold">
                Six collections, <span className="accent">each made to order.</span>
              </h2>
            </Reveal>
            <Reveal delay={120} className="md:col-span-5">
              <p className="text-lg leading-relaxed text-paper/85">
                From wedding trousseau trays to logo-printed corporate boxes — start with a collection, then tell us how to make it yours.
              </p>
            </Reveal>
          </div>
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3 lg:gap-6">
            {collections.map((c, i) => (
              <Reveal as="li" key={c.slug} delay={(i % 3) * 90}>
                <CollectionCard collection={c} index={i} />
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* Featured pieces — the products the original home page featured */}
      {featured.length > 0 && (
        <section aria-labelledby="featured-title" className="container-page py-20 md:py-28">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <Reveal>
              <p className="eyebrow">Featured pieces</p>
              <h2 id="featured-title" className="mt-4 text-title font-bold">Good places to start</h2>
            </Reveal>
            <Link href="/collections" className="btn btn-outline btn-sm">
              All {products.length} designs <ArrowRight size={16} />
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
            {featured.map((p, i) => (
              <Reveal key={p.slug} delay={(i % 4) * 70}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* How ordering works */}
      <section aria-labelledby="process-title" className="relative overflow-hidden border-y border-line bg-paper">
        <EngravedKnot tone="paper" flip="xy" className="-bottom-[18%] -left-[30%] w-[min(1000px,140vw)] md:-left-[12%] md:w-[min(1000px,75vw)]" />
        <div className="relative container-page grid gap-12 py-20 md:py-28 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <p className="eyebrow">How it works</p>
            <h2 id="process-title" className="mt-4 text-title font-bold">
              From idea to <span className="accent text-knot">wrapped</span> in four steps.
            </h2>
            <p className="mt-5 max-w-sm text-ink-soft">
              Everything is made for you, so ordering is a conversation rather than a checkout.
            </p>
            <Link href="/contact#quote" className="btn btn-primary mt-8">
              Start an enquiry <ArrowRight size={18} />
            </Link>
          </Reveal>
          <Reveal as="ol" delay={100} className="grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:grid-cols-2 lg:col-span-8">
            {STEPS.map((s, i) => (
              <li key={s.title} className="bg-paper p-7 md:p-9">
                <span className="font-display text-[2.5rem] leading-none font-bold text-knot tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-6 text-xl font-semibold tracking-[-0.015em]">{s.title}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-stone">{s.body}</p>
              </li>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Materials */}
      <section aria-labelledby="materials-title" className="container-page py-20 md:py-28">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">Materials</p>
          <h2 id="materials-title" className="mt-4 text-title font-bold">Chosen for the gift inside.</h2>
        </Reveal>
        <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {MATERIALS.map((m, i) => {
            const p = getProduct(m.slug);
            const img = p ? cardImage(p) : null;
            return (
              <Reveal key={m.title} delay={i * 80}>
                <Link href={p ? `/products/${p.slug}` : "/collections"} className="group block">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] border border-line bg-paper">
                    {img && <Image src={img} alt={p!.name} fill sizes="(min-width: 1024px) 20rem, (min-width: 640px) 45vw, 90vw" className="object-cover transition-transform duration-[var(--duration-slow)] ease-[var(--ease-out-soft)] group-hover:scale-[1.04]" />}
                  </div>
                  <h3 className="mt-4 text-xl font-semibold tracking-[-0.015em] group-hover:text-knot">{m.title}</h3>
                  <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-stone">{m.body}</p>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Studio */}
      <section aria-labelledby="studio-title" className="relative overflow-hidden bg-ink text-paper">
        <EngravedKnot tone="ink" className="-top-[1%] -right-[55%] w-[170vw] md:top-auto md:right-auto md:-bottom-[30%] md:-left-[16%] md:w-[min(1250px,130vw)]" />
        <div className="relative container-page grid gap-12 py-20 md:py-28 lg:grid-cols-12 lg:items-center">
          <Reveal className="lg:col-span-6">
            <p className="eyebrow eyebrow-on-dark">The studio</p>
            <h2 id="studio-title" className="mt-4 text-display font-bold">
              Made in Jungpura, <span className="accent text-[#ff7a5c]">New Delhi.</span>
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-paper/75">
              Pink Knots was founded by {site.founder} in {site.founded}. Production, quality control, warehousing and packing all happen under one roof.
            </p>
            <Link href="/about" className="btn btn-ghost-light mt-8">
              About Pink Knots <ArrowRight size={18} />
            </Link>
          </Reveal>
          <Reveal delay={120} className="lg:col-span-6">
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] bg-paper/12">
              {[
                { k: "Since", v: String(site.founded) },
                { k: "Designs", v: String(products.length) },
                { k: "Typical minimum", v: "50 pcs" },
                { k: "Certified", v: "ISO · MSME" },
              ].map((f) => (
                <div key={f.k} className="bg-ink p-6 md:p-8">
                  <dt className="text-xs font-semibold tracking-[0.14em] text-paper/55 uppercase">{f.k}</dt>
                  <dd className="mt-3 font-display text-[clamp(1.75rem,1.2rem+1.6vw,2.75rem)] leading-none font-bold tracking-[-0.03em]">{f.v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      {/* Closing CTA */}
      <section aria-labelledby="cta-title" className="container-page py-20 md:py-28">
        <Reveal className="relative overflow-hidden rounded-[1.5rem] bg-kraft px-6 py-14 md:px-14 md:py-20">
          <EngravedKnot tone="kraft" className="top-1/2 -right-[30%] w-[min(820px,130%)] -translate-y-1/2 md:-right-[6%] md:w-[min(820px,62%)]" />
          <div className="relative max-w-2xl">
            <h2 id="cta-title" className="text-display font-bold">
              Tell us about the <span className="accent text-knot">occasion.</span>
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-soft">
              Share what you have in mind — quantities, sizes, branding, timeline — and we’ll come back with options and a quote.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contact#quote" className="btn btn-primary">Request a quote <ArrowRight size={18} /></Link>
              <a href={site.phone.href} className="btn btn-outline"><Phone size={18} /> {site.phone.display}</a>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
