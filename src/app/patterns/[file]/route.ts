import { KNOT_CUT, KNOT_OVER, KNOT_UNDER, KNOT_VIEWBOX } from "@/components/knotPaths";

// Background tile of small debossed knots, used by the .knots-* classes in globals.css.
// Each knot is drawn three times — a light rim (bottom-right), a dark rim (top-left), then the
// tinted recess — so it reads as pressed into the surface without an SVG filter per tile.
// Light comes from the top left. Tones are tuned to the surface colour they sit on, and kept
// faint: the rims carry the depth, the recess barely tints, so text over the tile stays clean.
const TONES = {
  paper: { fill: "rgb(120 40 110 / 0.012)", shadow: "rgb(80 30 80 / 0.075)", light: "rgb(255 255 255 / 1)" },
  lilac: { fill: "rgb(120 40 110 / 0.025)", shadow: "rgb(100 30 90 / 0.11)", light: "rgb(255 255 255 / 0.9)" },
  knot: { fill: "rgb(70 0 60 / 0.04)", shadow: "rgb(50 0 45 / 0.14)", light: "rgb(255 190 240 / 0.12)" },
  ink: { fill: "rgb(0 0 0 / 0.1)", shadow: "rgb(0 0 0 / 0.32)", light: "rgb(240 225 255 / 0.05)" },
} as const;

type Tone = keyof typeof TONES;

// Half-drop lattice: every other knot is mirrored and tilted the other way, like a woven repeat.
const TILE = { w: 132, h: 112 };
const KNOT_W = 26;
const PLACEMENTS = [
  { x: 33, y: 28, rotate: -14, mirror: false },
  { x: 99, y: 84, rotate: 14, mirror: true },
];
// Pinpricks between the knots, so the repeat reads as a stitched pattern rather than a grid.
const DOTS = [
  { x: 99, y: 28 },
  { x: 33, y: 84 },
];

const [, , VW, VH] = KNOT_VIEWBOX.split(" ").map(Number);
const S = KNOT_W / VW;

function knots() {
  const uses = PLACEMENTS.map(
    (p) =>
      `<use href="#k" transform="translate(${p.x} ${p.y}) rotate(${p.rotate}) scale(${p.mirror ? -S : S} ${S}) translate(${-VW / 2} ${-VH / 2})"/>`,
  ).join("");
  const dots = DOTS.map((d) => `<circle cx="${d.x}" cy="${d.y}" r="1.3"/>`).join("");
  return uses + dots;
}

function tile(tone: Tone) {
  const t = TONES[tone];
  const body = knots();
  // Every mark sits well inside the tile, so the rims never clip at a seam.
  const wrap = (fill: string, dx: number, dy: number) =>
    `<g fill="${fill}" transform="translate(${dx} ${dy})">${body}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE.w}" height="${TILE.h}" viewBox="0 0 ${TILE.w} ${TILE.h}">
<defs>
<mask id="c" maskUnits="userSpaceOnUse" x="0" y="0" width="${VW}" height="${VH}"><rect width="${VW}" height="${VH}" fill="#fff"/><path d="${KNOT_CUT}" stroke="#000" stroke-width="14" stroke-linejoin="round"/></mask>
<g id="k"><path d="${KNOT_UNDER}" mask="url(#c)"/><path d="${KNOT_OVER}"/></g>
</defs>
${wrap(t.light, 0.7, 0.9)}${wrap(t.shadow, -0.6, -0.8)}${wrap(t.fill, 0, 0)}
</svg>`;
}

export const dynamic = "force-static";

export function generateStaticParams() {
  return Object.keys(TONES).map((tone) => ({ file: `knots-${tone}.svg` }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const tone = file.match(/^knots-(\w+)\.svg$/)?.[1];
  if (!tone || !(tone in TONES)) return new Response("Not found", { status: 404 });
  return new Response(tile(tone as Tone), {
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400" },
  });
}
