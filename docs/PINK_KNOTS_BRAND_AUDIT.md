# Pink Knots — brand audit

Audited 2026-10-27. Tokens live in `src/app/globals.css`; this file records where they came from.

## Sources

| Source | Status |
|---|---|
| `https://www.pink-knots.co/` (brief's primary reference) | **Not inspected.** The domain does not exist: Google DNS returns NXDOMAIN for both `pink-knots.co` and `www.pink-knots.co`. |
| `https://www.pink-knots.com/` | Inspected in Chrome (rendered page, computed styles, logo source). IndiaMART-hosted catalogue template. |
| `pink-knots-site-content.md` | Scraped content of the `.com` site; source for all business facts on this site. |
| Logo | `docs/brand/pink-knots-logo-original.png`, byte-identical to `https://4.imimg.com/data4/KP/YT/MY-15940038/pink-knots.png`, the unsuffixed original behind the site's 90 px header logo. The `-1000x1000` URL returns the same 120 × 120 file; 250/500 px variants are refused. **No larger or vector logo is publicly available.** |

## Logo

**Measured colours.** Sampled from interior pixels only (anti-aliased edge pixels, background and specks excluded). The source is a 120 px compressed PNG, so treat these as close approximations, not a brand specification.

| Part | Colour | Notes |
|---|---|---|
| Wordmark "Pink Knots" | `#210F31` | deep aubergine (HSL 272° 53% 13%), not black; darkest strokes `#130720` |
| Ribbon, dominant | `#B2209A` | magenta; range `#8A1586` → `#E73AC6` |
| Ribbon, violet | `#58167D` | |
| Ribbon, tips | `#13106D` | indigo |
| Ribbon, green | `#80E63E` | range `#4AA538` → `#AEFF54` |
| Ribbon, highlight | `#E9FF79` | lime |

**File.** 120 × 120 RGBA. The artwork sits on **opaque white** (8,727 near-white opaque pixels), with transparent bands above and below.

**Background treatment: removed (Option A).** `scripts/logo-cutout.mjs` regenerates `public/brand/pink-knots-logo.png` (119 × 98) from the untouched original:

- near-white neutral pixels → transparent;
- **all 2,277 artwork interior pixels keep their exact original RGB at full opacity** (verified pixel-for-pixel);
- only the 1 px anti-aliased fringe (1,257 px) gets partial alpha, solved against the neighbouring artwork colour so no white halo remains;
- specks of 5 px or fewer (JPEG ringing) are dropped. The smallest real detail, the dot of the "i", is 9 px.

The earlier cut-out used colour-to-alpha on every pixel. That left only 26 pixels fully opaque, so on the ivory header the lime turned olive and the magenta dulled. It has been replaced.

**Usage rules**
- Light grounds only (ivory, paper, kraft, white). The wordmark is aubergine and disappears on aubergine or red.
- On dark sections (footer), it sits on a paper `.logo-tile`.
- Display at **56 px tall or less** (`h-14`). The source is 98 px, so anything larger is upscaling.
- No CSS filters, blend modes, opacity or recolouring. Next's image optimisation is off site-wide, so the PNG is served as-is.
- **Ask Pink Knots for the original vector/high-res logo file.** It would sharpen the mark on high-DPI screens.

## Existing website (`pink-knots.com`), verified

| Role | Value |
|---|---|
| Primary interface red (buttons, About panel, links) | `rgb(196 30 2)` `#C41E02`; also `#C20000`, `#BE2A11` |
| Nav bar / dark bands | `#000000`, `#242424`, `#030303` |
| Header, cards | `#FFFFFF` |
| Page background | `#F2F2F2` |
| Body text | `#6E6E6E`, `#474747`, `#111111` |
| Typeface | Roboto Condensed 300/400; Arial fallback |

The logo appears top-left at 90 px on a white header, and it is the only place purple or green appears. The red was the old interface colour; the owner chose the logo's palette instead (see Decisions).

## Draft before this audit

Knot Red `#C82A0F`, warm charcoal ink `#1A1613`, ivory `#F6F1E9`, paper `#FFFDF9`, kraft `#E7DCC9`, a charcoal 3D box with a red ribbon. Typefaces: Bricolage Grotesque, Geist, Instrument Serif italic.

**Why the logo felt disconnected**
1. Nothing in the interface shared a colour with the mark: red and brown-black next to magenta, lime and aubergine.
2. The washed-out cut-out (see above).
3. The logo had about 4 px of clear space in a 72 px header and read as dropped in.

## Decisions

**The theme is the logo's own palette (decided 2026-10-27, at the owner's request).** Every brand colour on the site is one sampled from the logo artwork; the earlier red (`#C82A0F`, continuous with the `.com` site's `#C41E02`) has been removed everywhere, including the 3D ribbon.

| Logo colour | Exact value | Role on the site |
|---|---|---|
| Wordmark aubergine | `#210F31` | text, dark surfaces (studio band, mega-menu panel, contact card), the 3D box |
| Ribbon magenta | `#B2209A` | buttons, links, active nav, the "Inside every box" band, 3D ribbon and liner |
| Ribbon violet | `#58167D` | hover / pressed |
| Ribbon light purple | `#E73AC6` | italic display accents ("box.", "knot."), accents on dark |
| Ribbon green | `#80E63E` | "added to quote" state, quote-count and index badges, success, accents on dark, the box's foil lettering |
| Deeper ribbon green | `#4AA538` | eyebrow dots on white |
| Ribbon lime highlight | `#E9FF79` | text selection |
| Ribbon indigo tip | `#13106D` | token only (`knot-ink`) |
| Logo ground (white) | `#FFFFFF` | page, cards |

Derived from those: `lilac` `#FBEEF8` (light purple at 9% on white) for alternate sections, `knot-tint` `#F9E1F4` (16%) for selected states, and violet-grey lines and secondary text.

**No colour from outside the logo.** Form errors use the logo violet `#58167D` with a 2 px border and an alert icon, so they never rely on colour alone (magenta is the action colour, so it can't also mean "error").

### Final palette

| Token | Value | Use |
|---|---|---|
| `--color-brand-primary` → `ink` | `#210F31` | text, dark surfaces, 3D box |
| `--color-brand-secondary` → `leaf` | `#80E63E` | green accents |
| `--color-brand-accent` → `knot` | `#B2209A` | buttons, links, brand band |
| `--color-brand-accent-hover` → `knot-deep` | `#58167D` | hover |
| `knot-light` (= `knot-on-dark`) | `#E73AC6` | display accents; accents on dark |
| `leaf-deep` | `#4AA538` | decorative green on white |
| `lime` | `#E9FF79` | selection |
| `--color-background-primary` → `canvas` | `#FFFFFF` | page |
| `--color-background-secondary` → `lilac` | `#FBEEF8` | alternate sections, panels |
| `--color-surface` → `paper` | `#FFFFFF` | cards, fields |
| `--color-text-primary` → `ink` | `#210F31` | |
| `--color-text-secondary` → `stone` | `#665C6C` | |
| `ink-soft` | `#43354D` | lead and supporting copy |
| `--color-border` → `line` / `line-strong` | `#ECE0EA` / `#D5C3D2` | |
| `--color-focus-ring` | `ink`; `paper` inside `.surface-dark` | keyboard focus |
| `--color-success` → `leaf` | `#80E63E` | filled, with aubergine icon |
| `--color-error` → `knot-deep` | `#58167D` | field errors, always with an icon |

### Contrast (WCAG 2.x)

| Pair | Ratio |
|---|---|
| ink on white | 17.8 |
| stone on white / lilac | 6.3 / 5.5 |
| white on magenta (button text, magenta band) | 5.9 |
| magenta on white (links) | 5.9 |
| white on violet (hover) | 11.5 |
| light purple on white | 3.6 — **display sizes only** (AA large text); never body copy |
| light purple on aubergine | 4.9 |
| green on aubergine / aubergine on green | 11.3 |
| lime on aubergine | 16.2 |

Green on white is too light for text (`#4AA538` is 3.1:1), so on white it only appears as dots and filled badges with aubergine text. Focus rings are aubergine on light grounds and white on aubergine and magenta (`.surface-dark`). Field focus is ink; errors use the error colour.

## Typography

Kept: **Bricolage Grotesque** (display), **Geist** (text), and **Instrument Serif italic** as a single-word accent ("box.", "knot."). The accent is part of the headline's identity, so it stays a third family, used only for one word at a time.

Scale tokens: `hero`, `display`, `title` (h2), `subtitle` (h3), `lead`, `label` (eyebrows, product category), plus Tailwind's base sizes for body and small text. Headings use `text-wrap: balance` and paragraphs `pretty`. The hero copy column narrows below `xl`, so the headline keeps its three-line "The gift / starts with / the box." stack instead of running into the box.

## 3D box and imagery

- Rigid box in the wordmark's aubergine (`0x1F0F2B` before lighting), with a magenta ribbon and liner and foil lettering in the logo green. White tissue; the lights are neutral so the logo colours read true.
- The liner is pre-darkened (`KNOT_LIT 0x7D0C6B`) so it renders at `#B3239B` against the `#B2209A` target, and the flat magenta overlay and next section take over without a step. The DOM card's colours (`CARD_RENDERED`) were re-sampled from the landed frame.
- Camera framing now scales continuously with stage aspect, so the box stays clear of the copy at every size. Portrait stages put the copy under the box, and the CSS uses the same aspect test (container query on the stage) as the scene.
- Background knots are one small repeating pattern (26 px knots, `src/app/patterns`), lined up to a single page-wide grid by `KnotsAlign`, so they run unbroken across sections. The earlier giant engraved knots (560–1250 px) were removed: they broke the scale of the pattern, and their SVG filters halved the scroll frame rate over the collections band.
- Favicon: the logo's infinity symbol, cropped from the cut-out (same pixels) — replaces the earlier redrawn "PK" monogram.
- Product photography is untouched. No filters or global grading: the photos are the makers' own and show the real finishes.

## Open items

- High-resolution or vector logo from Pink Knots (see Logo).
- If `pink-knots.co` is meant to be a live domain, it isn't registered or isn't resolving.
