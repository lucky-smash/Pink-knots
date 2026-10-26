# Pink Knots website

Next.js 15 (App Router) + Tailwind CSS v4 + three.js. Custom gift packaging studio, New Delhi.

Content comes from `pink-knots-site-content.md` (the scraped original site), never edited by hand:

```
npm run data:extract   # markdown -> src/data/catalogue.json (6 collections, 53 categories, 408 products)
npm run images:fetch   # IndiaMART photos -> public/products/*.webp + src/data/images.json (safe to re-run)
```

```
npm run dev            # http://localhost:3000
npm run build          # NEXT_DIST_DIR=.next-prod npm run build to build beside a running dev server
npm run lint && npm run typecheck
node scripts/behaviour.mjs                 # interaction checks against a running server
node scripts/shot.mjs /path 1440 900 0 800 # screenshots at scroll offsets (px) into .shots/
```

- Design tokens: `src/app/globals.css` (`@theme`). Knot Red `#C82A0F` is the only brand colour.
- Gift-box hero: `src/components/home/giftBoxScene.ts` (procedural three.js, driven by `setProgress(0..1)`)
  and `GiftHero.tsx` (sticky scroll stage, captions, fallbacks for reduced motion / no WebGL / low power).
- Ordering is enquiry-based: the quote list (`src/components/quote/`) replaces a cart. The form currently
  prepares the enquiry for copy/call/IndiaMART — connect it to an email or form endpoint once one exists.
