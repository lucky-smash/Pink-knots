import { useId } from "react";
import { KNOT_CUT, KNOT_OVER, KNOT_UNDER, KNOT_VIEWBOX } from "@/components/knotPaths";

// The PK badge from pink-knots.com (its favicon), redrawn as vector so it stays crisp.
export function PkBadge({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill="var(--color-knot)" />
      <g fill="none" stroke="var(--color-paper)" strokeWidth="2.2">
        <path d="M11 26.6V13.4h4.4a3.65 3.65 0 0 1 0 7.3H11" />
        <path d="M21.6 13.4v13.2M29.2 13.4l-7.6 7.7M24.4 18.3l5.1 8.3" />
      </g>
    </svg>
  );
}

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

export function Wordmark({ tone = "dark", className = "" }: { tone?: "dark" | "light"; className?: string }) {
  const text = tone === "light" ? "text-paper" : "text-ink";
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <PkBadge className="h-9 w-9 shrink-0" />
      <span className={`font-display text-[1.375rem] leading-none font-bold tracking-[-0.035em] ${text}`}>
        Pink Knots
      </span>
    </span>
  );
}
