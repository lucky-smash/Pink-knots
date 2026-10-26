import { useId } from "react";
import { KNOT_CUT, KNOT_OVER, KNOT_UNDER, KNOT_VIEWBOX } from "@/components/knotPaths";

// The logo's ribbon knot pressed into a section's surface, like a blind deboss on board.
// Decorative only: place inside a `relative overflow-hidden` section and size/position it
// with className. Each tone is tuned to the surface colour it sits on.
const TONES = {
  knot: { fill: "rgb(90 12 0 / 0.16)", shadow: "rgb(60 8 0 / 0.6)", light: "rgb(255 200 185 / 0.5)" },
  ink: { fill: "rgb(0 0 0 / 0.28)", shadow: "rgb(0 0 0 / 0.85)", light: "rgb(255 240 225 / 0.14)" },
  kraft: { fill: "rgb(120 90 50 / 0.08)", shadow: "rgb(90 65 35 / 0.45)", light: "rgb(255 255 255 / 0.8)" },
  paper: { fill: "rgb(120 90 50 / 0.05)", shadow: "rgb(90 65 35 / 0.32)", light: "rgb(255 255 255 / 1)" },
} as const;

const [, , VW, VH] = KNOT_VIEWBOX.split(" ").map(Number);
// Mirroring happens inside the filter, so every copy keeps the same top-left light.
const FLIPS = { x: `translate(${VW} 0) scale(-1 1)`, y: `translate(0 ${VH}) scale(1 -1)`, xy: `translate(${VW} ${VH}) scale(-1 -1)` } as const;

export function EngravedKnot({ tone, flip, className = "" }: { tone: keyof typeof TONES; flip?: keyof typeof FLIPS; className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const t = TONES[tone];
  return (
    <svg viewBox={KNOT_VIEWBOX} className={`pointer-events-none absolute select-none ${className}`} aria-hidden="true" focusable="false">
      <defs>
        <mask id={`ec${id}`} maskUnits="userSpaceOnUse">
          <rect width="100%" height="100%" fill="white" />
          <path d={KNOT_CUT} fill="black" stroke="black" strokeWidth="14" strokeLinejoin="round" />
        </mask>
        {/* Tint the recess, then add an inner shadow on the top-left wall and a highlight on the bottom-right. */}
        <filter id={`ef${id}`} filterUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
          <feFlood floodColor={t.fill} />
          <feComposite in2="SourceAlpha" operator="in" result="body" />
          <feComponentTransfer in="SourceAlpha" result="inv">
            <feFuncA type="table" tableValues="1 0" />
          </feComponentTransfer>
          <feOffset in="inv" dx="3" dy="4" />
          <feGaussianBlur stdDeviation="2.5" result="shadowBlur" />
          <feFlood floodColor={t.shadow} />
          <feComposite in2="shadowBlur" operator="in" />
          <feComposite in2="SourceAlpha" operator="in" result="shadow" />
          <feOffset in="inv" dx="-2" dy="-3" />
          <feGaussianBlur stdDeviation="2" result="lightBlur" />
          <feFlood floodColor={t.light} />
          <feComposite in2="lightBlur" operator="in" />
          <feComposite in2="SourceAlpha" operator="in" result="light" />
          <feMerge>
            <feMergeNode in="body" />
            <feMergeNode in="shadow" />
            <feMergeNode in="light" />
          </feMerge>
        </filter>
      </defs>
      <g filter={`url(#ef${id})`}>
        <g transform={flip && FLIPS[flip]}>
          <path d={KNOT_UNDER} mask={`url(#ec${id})`} />
          <path d={KNOT_OVER} />
        </g>
      </g>
    </svg>
  );
}
