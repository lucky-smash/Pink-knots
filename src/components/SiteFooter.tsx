import Link from "next/link";
import { ArrowRight, Phone, Pin } from "@/components/Icons";
import { Wordmark } from "@/components/Wordmark";
import { collections } from "@/lib/catalogue";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="bg-ink text-paper">
      <div className="container-page grid gap-12 py-16 md:grid-cols-12 md:py-20">
        <div className="md:col-span-5">
          <Wordmark tone="light" />
          <p className="mt-5 max-w-sm text-[0.9375rem] leading-relaxed text-paper/70">
            Custom wooden trays, printed boxes and gift hampers for weddings, festivals and corporate gifting.
            Made to order in New Delhi since {site.founded}.
          </p>
          <Link href="/contact#quote" className="btn btn-primary mt-8">
            Request a quote <ArrowRight size={18} />
          </Link>
        </div>

        <nav aria-label="Collections" className="md:col-span-3">
          <p className="text-xs font-semibold tracking-[0.16em] text-paper/50 uppercase">Collections</p>
          <ul className="mt-4 space-y-2.5">
            {collections.map((c) => (
              <li key={c.slug}>
                <Link href={`/collections/${c.slug}`} className="link-draw text-[0.9375rem] text-paper/85 hover:text-paper">{c.name}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="md:col-span-4">
          <p className="text-xs font-semibold tracking-[0.16em] text-paper/50 uppercase">Visit or call</p>
          <address className="mt-4 space-y-4 text-[0.9375rem] leading-relaxed text-paper/85 not-italic">
            <a href={site.address.mapUrl} target="_blank" rel="noopener noreferrer" className="flex gap-3 hover:text-paper">
              <Pin size={18} className="mt-1 shrink-0 text-knot" />
              <span>{site.address.lines.map((l) => <span key={l} className="block">{l}</span>)}</span>
            </a>
            <a href={site.phone.href} className="flex items-center gap-3 hover:text-paper">
              <Phone size={18} className="shrink-0 text-knot" /> {site.phone.display}
            </a>
          </address>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-paper/70">
            <li><Link href="/about" className="link-draw hover:text-paper">About</Link></li>
            <li><Link href="/contact" className="link-draw hover:text-paper">Contact</Link></li>
            <li><Link href="/collections" className="link-draw hover:text-paper">All products</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-paper/10">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-paper/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Pink Knots, New Delhi. Prices shown are approximate and vary with customisation.</p>
          <p>GST {site.gst}</p>
        </div>
      </div>
    </footer>
  );
}
