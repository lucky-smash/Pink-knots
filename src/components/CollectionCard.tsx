import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@/components/Icons";
import { collectionCover, formatPrice, fromPrice, productsInCollection, type Collection } from "@/lib/catalogue";

export function CollectionCard({ collection, index }: { collection: Collection; index?: number }) {
  const cover = collectionCover(collection.slug);
  const list = productsInCollection(collection.slug);
  const from = fromPrice(list);

  return (
    <Link
      href={`/collections/${collection.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] bg-paper text-ink shadow-[var(--shadow-card)] transition-[transform,box-shadow] duration-[var(--duration-base)] ease-[var(--ease-out-soft)] hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-paper">
        {cover && (
          <Image src={cover.src} alt={cover.alt} fill sizes="(min-width: 1024px) 26rem, (min-width: 640px) 45vw, 90vw" className="object-contain transition-transform duration-[var(--duration-slow)] ease-[var(--ease-out-soft)] group-hover:scale-[1.04]" />
        )}
        {index != null && (
          <span className="absolute top-3 left-3 rounded-full bg-ink px-2.5 py-1 text-[0.6875rem] font-semibold text-paper tabular-nums">
            {String(index + 1).padStart(2, "0")}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col border-t border-line p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-[1.375rem] leading-tight font-semibold tracking-[-0.02em] group-hover:text-knot">{collection.name}</h3>
          <span className="text-sm text-stone tabular-nums">{list.length}</span>
        </div>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-stone">{collection.blurb}</p>
        <div className="mt-auto flex items-center justify-between pt-5 text-sm">
          <span className="text-ink-soft">{from != null ? <>From <strong className="font-semibold text-ink">{formatPrice(from)}</strong></> : "Price on request"}</span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-knot">
            View <ArrowRight size={16} className="transition-transform duration-[var(--duration-base)] group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}
