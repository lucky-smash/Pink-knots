import Link from "next/link";
import { CollectionCard } from "@/components/CollectionCard";
import { ArrowRight, Phone } from "@/components/Icons";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { GiftHero } from "@/components/home/GiftHero";
import { ProductPhoto } from "@/components/ProductPhoto";
import { cardImage, collections, featuredProducts, getProduct, isCutout, products } from "@/lib/catalogue";
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

const STUDIO_FACTS = [
  { k: "Making since", v: String(site.founded) },
  { k: "Workshop", v: `${site.premises}, Jungpura` },
  { k: "Team", v: site.team },
  { k: "Catalogue", v: `${products.length} designs, all customisable` },
  { k: "Minimum order", v: "Usually 50 pieces" },
  { k: "Registered", v: site.certifications.join(" · ") },
];

// What we ask for on the first call, so the closing section can say it up front.
const BRIEF = [
  { k: "Quantity", v: "Roughly how many pieces" },
  { k: "The piece", v: "A design from the catalogue, or a size and material" },
  { k: "Branding", v: "Logo, names, colours or a print you have in mind" },
  { k: "Date", v: "When it needs to reach you" },
];

export default function HomePage() {
  const featured = featuredProducts();

  return (
    <>
      <GiftHero productCount={products.length} collectionCount={collections.length} />

      {/* Inside the box: begins in the same lilac the hero ends on */}
      <section id="inside" aria-labelledby="inside-title" className="knots-lilac relative overflow-hidden bg-lilac">
        <div className="relative container-page pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="grid gap-6 md:grid-cols-12 md:items-end">
            <Reveal className="md:col-span-7">
              <p className="eyebrow">Inside every box</p>
              <h2 id="inside-title" className="mt-4 text-display font-bold">
                Six collections, <span className="accent text-leaf-dark">each made to order.</span>
              </h2>
            </Reveal>
            <Reveal delay={120} className="md:col-span-5">
              <p className="text-lg leading-relaxed text-ink-soft">
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
          <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {featured.map((p, i) => (
              <Reveal key={p.slug} delay={(i % 4) * 70}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* How ordering works */}
      <section aria-labelledby="process-title" className="knots-lilac relative overflow-hidden border-y border-line bg-lilac">
        <div className="relative container-page grid gap-12 py-20 md:py-28 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <p className="eyebrow">How it works</p>
            <h2 id="process-title" className="mt-4 text-title font-bold">
              From idea to <span className="accent text-leaf-dark">wrapped</span> in four steps.
            </h2>
            <p className="mt-5 max-w-sm text-ink-soft">
              Everything is <span className="font-semibold text-leaf-dark">made for you</span>, so ordering is a conversation rather than a checkout.
            </p>
            <Link href="/contact#quote" className="btn btn-primary mt-8">
              Start an enquiry <ArrowRight size={18} />
            </Link>
          </Reveal>
          <Reveal as="ol" delay={100} className="grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:grid-cols-2 lg:col-span-8">
            {STEPS.map((s, i) => (
              <li key={s.title} className="bg-paper p-7 md:p-9">
                <span className="font-display text-[2.5rem] leading-none font-bold text-knot tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-6 text-subtitle font-semibold">{s.title}</h3>
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
        {/* Landscape photos on phones, so each material is half a screen rather than more than one */}
        <div className="mt-10 grid gap-5 lg:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {MATERIALS.map((m, i) => {
            const p = getProduct(m.slug);
            const img = p ? cardImage(p) : null;
            return (
              <Reveal key={m.title} delay={i * 80}>
                <Link href={p ? `/products/${p.slug}` : "/collections"} className="card-box group block h-full">
                  {img ? (
                    <ProductPhoto src={img} alt={p!.name} cutout={isCutout(p!)} sizes="(min-width: 1024px) 20rem, (min-width: 640px) 45vw, 90vw" className="aspect-[4/3] rounded-[calc(var(--radius-card)-0.375rem)] sm:aspect-[4/5]" />
                  ) : (
                    <div className="aspect-[4/3] rounded-[calc(var(--radius-card)-0.375rem)] bg-mat sm:aspect-[4/5]" />
                  )}
                  <div className="px-3 pt-4 pb-2">
                    <h3 className="text-subtitle font-semibold transition-colors group-hover:text-knot-on-dark">{m.title}</h3>
                    <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-paper/70">{m.body}</p>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Studio */}
      <section aria-labelledby="studio-title" className="surface-dark knots-ink relative overflow-hidden bg-ink text-paper">
        <div className="relative container-page grid gap-12 py-20 md:py-28 lg:grid-cols-12 lg:items-center">
          <Reveal className="lg:col-span-6">
            <p className="eyebrow eyebrow-on-dark">The studio</p>
            <h2 id="studio-title" className="mt-4 text-display font-bold">
              Made in Jungpura, <span className="accent text-leaf">New Delhi.</span>
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-paper/75">
              Pink Knots was founded by {site.founder} in {site.founded}. Production, quality control, warehousing and packing all happen under one roof.
            </p>
            <Link href="/about" className="btn btn-ghost-light mt-8">
              About Pink Knots <ArrowRight size={18} />
            </Link>
          </Reveal>
          {/* Read like the spec sheet that goes out with an order, not a row of stat tiles */}
          <Reveal delay={120} className="lg:col-span-5 lg:col-start-8">
            <dl className="border-t border-paper/20 text-[0.9375rem]">
              {STUDIO_FACTS.map((f) => (
                <div key={f.k} className="grid grid-cols-[8.5rem_1fr] gap-4 border-b border-paper/20 py-4 sm:grid-cols-[10rem_1fr]">
                  <dt className="text-paper/55">{f.k}</dt>
                  <dd className="text-paper">{f.v}</dd>
                </div>
              ))}
            </dl>
            <a href={site.reviewsUrl} target="_blank" rel="noopener noreferrer" className="link-draw mt-6 inline-flex items-center gap-2 text-[0.9375rem] text-paper/85 hover:text-paper">
              Rated {site.rating.score} from {site.rating.count} customer reviews <ArrowRight size={16} />
            </a>
          </Reveal>
        </div>
      </section>

      {/* Closing enquiry: says exactly what we need to quote, then how to send it */}
      <section aria-labelledby="cta-title" className="knots-lilac bg-lilac">
        <div className="container-page grid gap-12 py-20 md:py-28 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-6">
            <h2 id="cta-title" className="text-display font-bold">
              Tell us about the <span className="accent text-knot-light">occasion.</span>
            </h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-soft">
              A rough idea is enough to start. We come back with options, samples where useful, and a quote.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Link href="/contact#quote" className="btn btn-primary">Request a quote <ArrowRight size={18} /></Link>
              <a href={site.phone.href} className="link-draw inline-flex items-center gap-2 font-semibold">
                <Phone size={18} /> or call {site.phone.display}
              </a>
            </div>
          </Reveal>
          <Reveal delay={120} className="lg:col-span-6">
            <p className="text-sm font-semibold text-ink">Helpful to have ready</p>
            <ol className="mt-4 border-t border-line-strong">
              {BRIEF.map((b, i) => (
                <li key={b.k} className="grid grid-cols-[2.25rem_1fr] gap-x-3 border-b border-line-strong py-4 sm:grid-cols-[2.25rem_8rem_1fr]">
                  <span className="text-sm text-stone tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-semibold">{b.k}</span>
                  <span className="col-start-2 text-ink-soft sm:col-start-3">{b.v}</span>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>
    </>
  );
}
