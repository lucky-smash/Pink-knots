import Link from "next/link";
import { ProductPhoto } from "@/components/ProductPhoto";
import { AddToQuoteButton } from "@/components/quote/AddToQuoteButton";
import { cardImage, getCategory, isCutout, moqLabel, moqNumber, priceLabel, type Product } from "@/lib/catalogue";
import { KnotMark } from "@/components/Wordmark";

export function ProductCard({ product, priority = false, showCategory = true }: { product: Product; priority?: boolean; showCategory?: boolean }) {
  const img = cardImage(product);
  const moq = moqLabel(product);
  const href = `/products/${product.slug}`;

  return (
    <article className="card-box group relative flex h-full w-full flex-col">
      <Link href={href} className="block" tabIndex={-1} aria-hidden="true">
        {img ? (
          <ProductPhoto
            src={img}
            alt=""
            cutout={isCutout(product)}
            sizes="(min-width: 1280px) 22rem, (min-width: 768px) 30vw, 50vw"
            priority={priority}
            className="aspect-square rounded-[calc(var(--radius-card)-0.375rem)]"
          />
        ) : (
          <div className="grid aspect-square place-items-center rounded-[calc(var(--radius-card)-0.375rem)] bg-mat">
            <KnotMark className="h-12 w-12 opacity-40" />
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col px-1.5 pt-3.5 pb-1 sm:px-2">
        {showCategory && (
          <p className="truncate text-xs text-paper/60">{getCategory(product.category)?.name}</p>
        )}
        <h3 className="mt-1 font-display text-[1.0625rem] leading-snug font-semibold tracking-[-0.015em] text-paper">
          <Link href={href} className="after:absolute after:inset-0 after:rounded-[var(--radius-card)] after:content-[''] group-hover:text-knot-on-dark focus-visible:outline-none">
            {product.name}
          </Link>
        </h3>
        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          <p className="text-sm leading-tight">
            <span className="block font-semibold text-paper tabular-nums">{priceLabel(product)}</span>
            {moq && <span className="mt-0.5 block text-xs text-paper/60">Min. order {moq}</span>}
          </p>
          {/* sits above the stretched link */}
          <div className="relative z-10">
            <AddToQuoteButton slug={product.slug} name={product.name} defaultQty={moqNumber(product) ?? 50} variant="compact" />
          </div>
        </div>
      </div>
    </article>
  );
}
