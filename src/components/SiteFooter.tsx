import Link from "next/link";
import { Phone, Pin } from "@/components/Icons";
import { Wordmark } from "@/components/Wordmark";
import { collections } from "@/lib/catalogue";
import { site } from "@/lib/site";

// Light ground so the original logo sits on the page as it was drawn, without a tile.
export function SiteFooter() {
  return (
    <footer className="knots-paper border-t border-line bg-paper text-ink">
      <div className="container-page grid gap-12 py-16 md:grid-cols-12 md:py-20">
        <div className="md:col-span-4">
          <Wordmark />
          <p className="mt-5 max-w-xs text-[0.9375rem] leading-relaxed text-stone">
            Custom wooden trays, printed boxes and gift hampers, made to order in New Delhi since {site.founded}.
          </p>
        </div>

        <nav aria-label="Collections" className="md:col-span-3 md:col-start-6">
          <p className="text-sm font-semibold">Collections</p>
          <ul className="mt-4 space-y-2.5 text-[0.9375rem] text-ink-soft">
            {collections.map((c) => (
              <li key={c.slug}>
                <Link href={`/collections/${c.slug}`} className="link-draw hover:text-ink">{c.name}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="md:col-span-4 md:col-start-9">
          <p className="text-sm font-semibold">The studio</p>
          <address className="mt-4 space-y-4 text-[0.9375rem] leading-relaxed text-ink-soft not-italic">
            <a href={site.address.mapUrl} target="_blank" rel="noopener noreferrer" className="flex gap-3 hover:text-ink">
              <Pin size={18} className="mt-1 shrink-0 text-knot" />
              <span>{site.address.lines.map((l) => <span key={l} className="block">{l}</span>)}</span>
            </a>
            <a href={site.phone.href} className="flex items-center gap-3 hover:text-ink">
              <Phone size={18} className="shrink-0 text-knot" /> {site.phone.display}
            </a>
          </address>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-soft">
            <li><Link href="/about" className="link-draw hover:text-ink">About</Link></li>
            <li><Link href="/contact" className="link-draw hover:text-ink">Contact</Link></li>
            <li><Link href="/collections" className="link-draw hover:text-ink">All products</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-stone sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Pink Knots, New Delhi. Prices shown are approximate and vary with customisation.</p>
          <p>{site.certifications.slice(0, 2).join(" · ")} · GST {site.gst}</p>
        </div>
      </div>
    </footer>
  );
}
