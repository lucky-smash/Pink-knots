// The "made for you" card ends the hero dive lying on the red floor, then hands over to a DOM
// copy that scrolls away with the page. Both size themselves from this, so the swap is seamless.

/** Card aspect (width / depth), matching the card mesh and its texture. */
export const CARD_ASPECT = 1.6;

/** Final card width as a fraction of the hero stage width, for a stage of this aspect. */
export function finalCardFraction(aspect: number) {
  // Never taller than ~36% of the stage; on narrow screens let it use most of the width.
  return Math.min(aspect < 0.9 ? 0.78 : 0.56, (0.36 * CARD_ASPECT) / aspect);
}
