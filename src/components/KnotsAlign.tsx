"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// The .knots-* pattern is one tile repeated, but each surface would otherwise start its own
// repeat at its top edge, so the lattice would jump at every section boundary. This shifts each
// surface's tile to a single page-wide grid, so the knots run on unbroken from section to section.
//
// Layers inside the sticky hero move while pinned; they're aligned to where they rest instead:
// data-knots-anchor="start" (top of the enclosing section) or "end" (flush with its bottom).
const TILE_H = 112; // keep in step with background-size in globals.css
const SELECTOR = ".knots-paper, .knots-lilac, .knots-knot, .knots-ink";

function align() {
  for (const el of document.querySelectorAll<HTMLElement>(SELECTOR)) {
    const anchor = el.dataset.knotsAnchor;
    const section = anchor ? el.closest("section") : null;
    let top: number;
    if (section) {
      const r = section.getBoundingClientRect();
      top = anchor === "end" ? r.bottom + scrollY - el.offsetHeight : r.top + scrollY;
    } else {
      top = el.getBoundingClientRect().top + scrollY;
    }
    el.style.setProperty("--knots-y", `${-(((top % TILE_H) + TILE_H) % TILE_H)}px`);
  }
}

export function KnotsAlign() {
  const pathname = usePathname();
  useEffect(() => {
    let raf = 0;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(align);
    };
    schedule();
    // Page height changes as images load, sections reveal and fonts swap
    const ro = new ResizeObserver(schedule);
    ro.observe(document.body);
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, [pathname]);
  return null;
}
