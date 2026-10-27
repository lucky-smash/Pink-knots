import Link from "next/link";
import { ArrowRight } from "@/components/Icons";
import { ProductPhoto } from "@/components/ProductPhoto";
import { collectionCover, formatPrice, fromPrice, productsInCollection, type Collection } from "@/lib/catalogue";

// An aubergine card with the cover photo mounted inside it, like a print in a passe-partout.
export function CollectionCard({ collection, index }: { collection: Collection; index?: number }) {
  const cover = collectionCover(collection.slug);
  const list = productsInCollection(collection.slug);
  const from = fromPrice(list);

  return (
    <Link href={`/collections/${collection.slug}`} className="card-box group flex h-full flex-col">
      {cover ? (
        <ProductPhoto
          src={cover.src}
          alt={cover.alt}
          cutout={cover.cutout}
          sizes="(min-width: 1024px) 26rem, (min-width: 640px) 45vw, 90vw"
          className="aspect-[4/3] rounded-[calc(var(--radius-card)-0.375rem)]"
        />
      ) : (
        <div className="aspect-[4/3] rounded-[calc(var(--radius-card)-0.375rem)] bg-lilac" />
      )}
      <div className="flex flex-1 flex-col px-3 pt-5 pb-2">
        <p className="text-label font-semibold tracking-[var(--text-label--letter-spacing)] text-paper/65 uppercase tabular-nums">
          {index != null && <span className="text-leaf">{String(index + 1).padStart(2, "0")} · </span>}
          {list.length} designs
        </p>
        <h3 className="mt-2 font-display text-subtitle font-semibold transition-colors group-hover:text-knot-on-dark">{collection.name}</h3>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-paper/70">{collection.blurb}</p>
        <div className="mt-auto pt-5">
          <div className="flex items-center justify-between border-t border-paper/15 pt-4 text-sm">
            <span className="text-paper/70">{from != null ? <>From <strong className="font-semibold text-paper">{formatPrice(from)}</strong></> : "Price on request"}</span>
            <span
              aria-hidden="true"
              className="grid h-10 w-10 place-items-center rounded-full border-[1.5px] border-paper/30 transition-[background-color,border-color,color] duration-[var(--duration-base)] group-hover:border-knot group-hover:bg-knot group-hover:text-paper"
            >
              <ArrowRight size={18} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
