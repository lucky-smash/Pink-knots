import Image from "next/image";
import { useId } from "react";
import { KNOT_CUT, KNOT_OVER, KNOT_UNDER, KNOT_VIEWBOX } from "@/components/knotPaths";

// The ribbon knot from the original logo, flat. The under strand is cut where the
// over strand crosses it.
export function KnotMark({ className = "", color = "var(--color-knot)" }: { className?: string; color?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg viewBox={KNOT_VIEWBOX} className={className} aria-hidden="true">
      <defs>
        <mask id={`kc${id}`} maskUnits="userSpaceOnUse">
          <rect width="100%" height="100%" fill="white" />
          <path d={KNOT_CUT} fill="black" stroke="black" strokeWidth="18" strokeLinejoin="round" />
        </mask>
      </defs>
      <g fill={color}>
        <path d={KNOT_UNDER} mask={`url(#kc${id})`} />
        <path d={KNOT_OVER} />
      </g>
    </svg>
  );
}

// The original logo from pink-knots.com, cut out of its white background with the artwork
// untouched (scripts/logo-cutout.mjs). The source is 98px tall, so it's never shown above
// 56px. Its lettering is aubergine, so on dark backgrounds it sits on a paper tile.
export function Wordmark({ tone = "dark", className = "" }: { tone?: "dark" | "light"; className?: string }) {
  return (
    <span className={`inline-flex ${tone === "light" ? "logo-tile" : ""} ${className}`}>
      <Image src="/brand/pink-knots-logo.png" alt="Pink Knots" width={119} height={98} priority className="h-12 w-auto md:h-14" />
    </span>
  );
}
