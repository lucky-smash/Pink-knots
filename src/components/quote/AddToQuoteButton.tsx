"use client";

import Link from "next/link";
import { Check, Plus } from "@/components/Icons";
import { useQuote } from "./QuoteProvider";

type Props = { slug: string; name: string; defaultQty: number; variant?: "full" | "compact" };

export function AddToQuoteButton({ slug, name, defaultQty, variant = "full" }: Props) {
  const { has, add, remove, ready } = useQuote();
  const added = ready && has(slug);

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={() => (added ? remove(slug) : add(slug, defaultQty))}
        aria-pressed={added}
        aria-label={added ? `Remove ${name} from quote list` : `Add ${name} to quote list`}
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border-[1.5px] transition-[background-color,border-color,color,transform] duration-[var(--duration-base)] ease-[var(--ease-out-soft)] active:scale-95 ${
          added ? "border-leaf bg-leaf text-ink" : "border-paper/30 bg-ink text-paper hover:border-knot hover:bg-knot hover:text-paper"
        }`}
      >
        {added ? <Check size={18} /> : <Plus size={18} />}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => (added ? remove(slug) : add(slug, defaultQty))}
        aria-pressed={added}
        className={`btn ${added ? "btn-outline" : "btn-primary"} min-w-[13rem]`}
      >
        {added ? <Check size={18} /> : <Plus size={18} />}
        {added ? "Added to quote list" : "Add to quote list"}
      </button>
      {added && (
        <Link href="/contact#quote" className="link-draw font-semibold text-knot">
          Review &amp; send enquiry
        </Link>
      )}
    </div>
  );
}
