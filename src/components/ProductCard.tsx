import Image from "next/image";
import Link from "next/link";
import { AddToQuoteButton } from "@/components/quote/AddToQuoteButton";
import { cardImage, getCategory, moqLabel, moqNumber, priceLabel, type Product } from "@/lib/catalogue";
import { KnotMark } from "@/components/Wordmark";

export function ProductCard({ product, priority = false, showCategory = true }: { product: Product; priority?: boolean; showCategory?: boolean }) {
  const img = cardImage(product);
  const moq = moqLabel(product);
  const href = `/products/${product.slug}`;

  return (
    <article className="group relative flex w-full flex-col">
      <Link href={href} className="relative block aspect-square overflow-hidden rounded-[var(--radius-card)] border border-line bg-paper transition-[border-color,box-shadow] duration-[var(--duration-base)] group-hover:border-line-strong group-hover:shadow-[var(--shadow-lift)]" tabIndex={-1} aria-hidden="true">
        {img ? (
          <Image
            src={img}
            alt=""
            fill
            sizes="(min-width: 1280px) 22rem, (min-width: 768px) 30vw, 50vw"
            priority={priority}
            className="object-contain transition-transform duration-[var(--duration-slow)] ease-[var(--ease-out-soft)] group-hover:scale-[1.035]"
          />
        ) : (
          <div className="grid h-full place-items-center bg-kraft/50">
            <KnotMark className="h-12 w-12 opacity-40" />
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col pt-3.5">
        {showCategory && (
          <p className="truncate text-[0.6875rem] font-semibold tracking-[0.14em] text-stone uppercase">{getCategory(product.category)?.name}</p>
        )}
        <h3 className="mt-1 font-display text-[1.0625rem] leading-snug font-semibold tracking-[-0.015em] text-ink">
          <Link href={href} className="after:absolute after:inset-0 after:content-[''] hover:text-knot focus-visible:outline-none">
            {product.name}
          </Link>
        </h3>
        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          <p className="text-sm leading-tight">
            <span className="block font-semibold text-ink tabular-nums">{priceLabel(product)}</span>
            {moq && <span className="mt-0.5 block text-xs text-stone">Min. order {moq}</span>}
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
