// The "made for you" card ends the hero dive lying on the magenta floor, then hands over to a DOM
// copy that scrolls away with the page. Both size and draw themselves from this, so the swap
// at HANDOFF is a straight replacement: same pixels, same place, no cross-fade.

/** Card aspect (width / depth), matching the card mesh and its texture. */
export const CARD_ASPECT = 1.6;

/** Hero progress at which the camera has landed and the DOM card replaces the 3D one. */
export const HANDOFF = 0.88;

/** The magenta settles by here; the rest of the hero is a hold, so the stage never starts
 *  scrolling away mid-dive (the follow lags the scrollbar a little on fast scrolls). */
export const SETTLED = 0.95;

/** Final card width as a fraction of the hero stage width, for a stage of this aspect. */
export function finalCardFraction(aspect: number) {
  // Never taller than ~36% of the stage; on narrow screens let it use most of the width.
  return Math.min(aspect < 0.9 ? 0.78 : 0.56, (0.36 * CARD_ASPECT) / aspect);
}

export type CardPalette = { paper: string; line: string; ink: string; leaf: string };

/** Colours the card is printed with (the 3D scene lights and tone-maps these). */
export const CARD_PRINT: CardPalette = { paper: "#ffffff", line: "#b2209a", ink: "#210f31", leaf: "#2f7d22" };

/**
 * The same card as the scene renders it once the camera has landed (lit + ACES), sampled from
 * the landed frame, for the DOM copy. Re-sample if the lights, exposure or card material change.
 */
export const CARD_RENDERED: CardPalette = { paper: "#efefef", line: "#e84fcb", ink: "#4e405e", leaf: "#66b353" };

/** Draws the card on a canvas of any size with a 1.6 aspect (laid out on a 512 × 320 grid). */
export function drawCard(c: HTMLCanvasElement, { paper, line, ink, leaf }: CardPalette) {
  const g = c.getContext("2d")!;
  const css = getComputedStyle(document.documentElement);
  // next/font registers its own family names; read them from the CSS variables it sets
  const serif = css.getPropertyValue("--font-instrument").trim() || "'Instrument Serif'";
  const display = css.getPropertyValue("--font-bricolage").trim() || "'Bricolage Grotesque'";
  g.setTransform(c.width / 512, 0, 0, c.height / 320, 0, 0);
  g.fillStyle = paper;
  g.fillRect(0, 0, 512, 320);
  g.strokeStyle = line;
  g.lineWidth = 6;
  g.strokeRect(22, 22, 512 - 44, 320 - 44);
  // Magenta frame, green lettering: the two strands of the logo ribbon
  g.fillStyle = leaf;
  g.textAlign = "center";
  g.font = `italic 64px ${serif}, Georgia, serif`;
  g.fillText("made for you", 256, 166);
  g.font = `600 22px ${display}, Arial, sans-serif`;
  g.fillStyle = ink;
  g.fillText("PINK KNOTS", 256, 226);
}
