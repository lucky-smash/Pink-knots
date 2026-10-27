import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@/components/Icons";
import { PageIntro } from "@/components/PageIntro";
import { Reveal } from "@/components/Reveal";
import { VideoEmbed } from "@/components/VideoEmbed";
import { cardImage, getProduct, products } from "@/lib/catalogue";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: `Pink Knots has made custom gift packaging in Jungpura, New Delhi since ${site.founded}. Founded by ${site.founder}.`,
};

// Rewritten from the original profile page (content file §3–5); facts only.
const DEPARTMENTS = [
  { title: "Production", body: "Boxes, trays and hampers are cut, printed, finished and assembled here." },
  { title: "Quality control", body: "Each stage is supervised, and finished pieces are checked for looks, design accuracy and finishing." },
  { title: "Warehouse & packing", body: "Orders are packed to travel safely through loading, unloading and transit." },
  { title: "Administration", body: "One point of contact from enquiry to dispatch." },
];

const TEAM = ["Procurement agents", "Production professionals", "Quality controllers", "Warehousing experts", "Packaging personnel", "Sales & marketing staff"];

const PRINCIPLES = [
  "Prompt delivery of orders",
  "Stringent quality checks",
  "An experienced team",
  "Ethical business dealings",
];

const GALLERY = ["designer-wedding-invite-hampers", "printed-wedding-boxes", "designer-wooden-serving-tray-set", "festival-gift-pack-box"];

export default function AboutPage() {
  const gallery = GALLERY.map((s) => getProduct(s)).filter((p) => p && cardImage(p));

  return (
    <>
      <PageIntro
        eyebrow={`Since ${site.founded}`}
        title={<>We make the part of the gift <span className="accent text-leaf-dark">people see first.</span></>}
        crumbs={[{ href: "/", label: "Home" }, { href: "/about", label: "About" }]}
      >
        Pink Knots is a custom gift-packaging maker in Jungpura, New Delhi, founded by {site.founder}. We design and make wooden and MDF
        boxes and trays, printed cardboard and rigid boxes, wedding and festive hampers, and corporate gifts — each one made to order.
      </PageIntro>

      <section aria-label="Our work" className="container-page py-14 md:py-20">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
          {gallery.map((p, i) => (
            <Reveal key={p!.slug} delay={i * 70}>
              <Link href={`/products/${p!.slug}`} className="group block">
                <div className={`relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-paper ${i % 2 ? "aspect-[4/5] md:mt-10" : "aspect-[4/5]"}`}>
                  <Image src={cardImage(p!)!} alt={p!.name} fill sizes="(min-width: 768px) 22vw, 45vw" className="object-cover transition-transform duration-[var(--duration-slow)] group-hover:scale-[1.04]" />
                </div>
                <p className="mt-2 text-sm text-stone group-hover:text-knot">{p!.name}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section aria-labelledby="house-title" className="knots-lilac border-y border-line bg-lilac">
        <div className="container-page grid gap-12 py-16 md:py-24 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <p className="eyebrow">Under one roof</p>
            <h2 id="house-title" className="mt-4 text-title font-bold">A {site.premises} studio in Jungpura.</h2>
            <p className="mt-5 text-ink-soft">
              Our team of {site.team} works across four departments, so a design moves from idea to packed order without leaving the building.
            </p>
          </Reveal>
          <Reveal delay={100} className="grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:grid-cols-2 lg:col-span-8">
            {DEPARTMENTS.map((d, i) => (
              <div key={d.title} className="bg-paper p-7 md:p-8">
                <span className="font-display text-sm font-bold text-knot tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-4 text-xl font-semibold tracking-[-0.015em]">{d.title}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-stone">{d.body}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <section aria-labelledby="video-title" className="container-page grid gap-10 py-16 md:py-24 lg:grid-cols-12 lg:items-center">
        <Reveal className="lg:col-span-5">
          <p className="eyebrow">See the studio</p>
          <h2 id="video-title" className="mt-4 text-title font-bold">The people behind the packaging.</h2>
          <ul className="mt-6 flex flex-wrap gap-2">
            {TEAM.map((t) => (
              <li key={t} className="rounded-full border border-line-strong px-3.5 py-1.5 text-sm text-ink-soft">{t}</li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={100} className="lg:col-span-7">
          <VideoEmbed id={site.videoId} title="Pink Knots corporate video" />
        </Reveal>
      </section>

      <section aria-labelledby="credentials-title" className="surface-dark knots-ink bg-ink text-paper">
        <div className="container-page grid gap-12 py-16 md:py-24 lg:grid-cols-2">
          <Reveal>
            <p className="eyebrow eyebrow-on-dark">What we hold ourselves to</p>
            <h2 id="credentials-title" className="mt-4 text-title font-bold">Simple promises, kept on every order.</h2>
            <ul className="mt-8 space-y-3">
              {PRINCIPLES.map((p) => (
                <li key={p} className="flex items-center gap-3 text-lg text-paper/85">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-leaf" aria-hidden="true" /> {p}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={100}>
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] bg-paper/12">
              {[
                { k: "Founded", v: String(site.founded) },
                { k: "Designs", v: String(products.length) },
                { k: "Team", v: site.team.replace(" people", "") },
                { k: "IndiaMART rating", v: `${site.rating.score} / 5` },
              ].map((f) => (
                <div key={f.k} className="bg-ink p-6 md:p-7">
                  <dt className="text-xs font-semibold tracking-[0.14em] text-paper/55 uppercase">{f.k}</dt>
                  <dd className="mt-3 font-display text-[clamp(1.75rem,1.3rem+1.4vw,2.5rem)] leading-none font-bold tracking-[-0.03em]">{f.v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 text-sm leading-relaxed text-paper/60">
              {site.certifications.join(" · ")} · GST {site.gst}. Rating from {site.rating.count} buyer reviews —{" "}
              <a href={site.reviewsUrl} target="_blank" rel="noopener noreferrer" className="link-draw text-paper/85">read them</a>.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="container-page py-16 text-center md:py-24">
        <h2 className="mx-auto max-w-2xl text-display font-bold">Have an occasion in mind?</h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/contact#quote" className="btn btn-primary">Request a quote <ArrowRight size={18} /></Link>
          <Link href="/collections" className="btn btn-outline">Browse collections</Link>
        </div>
      </section>
    </>
  );
}
