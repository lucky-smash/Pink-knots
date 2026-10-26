import type { Metadata } from "next";
import { Phone, Pin } from "@/components/Icons";
import { PageIntro } from "@/components/PageIntro";
import { QuoteForm, type QuoteLookup } from "@/components/quote/QuoteForm";
import { cardImage, getCategory, moqNumber, priceLabel, products } from "@/lib/catalogue";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact & quotes",
  description: `Request a quote for custom gift packaging from Pink Knots, Jungpura, New Delhi. Call ${site.phone.display}.`,
};

export default function ContactPage() {
  // Slim lookup so the client form can show quote-list items without the full catalogue.
  const lookup: QuoteLookup = Object.fromEntries(
    products.map((p) => [p.slug, { name: p.name, image: cardImage(p), price: priceLabel(p), moq: moqNumber(p), category: getCategory(p.category)?.name ?? "" }]),
  );

  return (
    <>
      <PageIntro
        eyebrow="Contact"
        title={<>Let’s make something <span className="accent text-knot">worth unwrapping.</span></>}
        crumbs={[{ href: "/", label: "Home" }, { href: "/contact", label: "Contact" }]}
      >
        To get the best quote, tell us what you’re looking for, the features or specifications, how it will be used, and the quantity you need.
      </PageIntro>

      <section className="container-page grid gap-12 py-14 md:py-20 lg:grid-cols-12 lg:gap-16">
        <div id="quote" className="scroll-mt-28 lg:col-span-8">
          <QuoteForm lookup={lookup} phone={site.phone} enquiryUrl={site.enquiryUrl} />
        </div>

        <aside className="lg:col-span-4">
          <div className="space-y-4 lg:sticky lg:top-28">
            <div className="rounded-[var(--radius-card)] bg-ink p-7 text-paper">
              <p className="eyebrow eyebrow-on-dark">Call us</p>
              <a href={site.phone.href} className="mt-4 flex items-center gap-3 font-display text-2xl font-bold tracking-[-0.02em] hover:text-kraft">
                <Phone size={22} className="text-knot" /> {site.phone.display}
              </a>
              <p className="mt-3 text-sm text-paper/60">Ask for {site.founder}.</p>
            </div>
            <div className="rounded-[var(--radius-card)] border border-line bg-paper p-7">
              <p className="eyebrow">Visit the studio</p>
              <address className="mt-4 text-[0.9375rem] leading-relaxed not-italic">
                <span className="font-semibold">Pink Knots</span>
                {site.address.lines.map((l) => <span key={l} className="block text-ink-soft">{l}</span>)}
              </address>
              <a href={site.address.mapUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm mt-5">
                <Pin size={16} /> Open in Maps
              </a>
            </div>
            <div className="rounded-[var(--radius-card)] border border-line p-7 text-sm leading-relaxed text-stone">
              <p className="font-semibold text-ink">Good to know</p>
              <ul className="mt-3 space-y-2">
                <li>Most pieces have a minimum order of 50.</li>
                <li>Everything is made to order — typically two to three weeks.</li>
                <li>Prices shown are approximate and depend on customisation.</li>
              </ul>
            </div>
          </div>
        </aside>
      </section>
    </>
  );
}
