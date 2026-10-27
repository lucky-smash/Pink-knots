"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, Close, Menu, Phone } from "@/components/Icons";
import { Wordmark } from "@/components/Wordmark";
import { useQuote } from "@/components/quote/QuoteProvider";
import { site } from "@/lib/site";

export type NavCollection = { slug: string; name: string; blurb: string; count: number };

const CLOSE_DELAY = 220; // ms of grace so the menu survives diagonal pointer travel

export function SiteHeader({ collections }: { collections: NavCollection[] }) {
  const pathname = usePathname();
  const { items, ready } = useQuote();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const openMenu = useCallback(() => {
    window.clearTimeout(closeTimer.current);
    setMenuOpen(true);
  }, []);
  const scheduleClose = useCallback(() => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setMenuOpen(false), CLOSE_DELAY);
  }, []);

  // Close everything on navigation.
  useEffect(() => {
    setMenuOpen(false);
    setSheetOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (menuOpen) {
        setMenuOpen(false);
        triggerRef.current?.focus();
      }
      setSheetOpen(false);
    };
    const onPointer = (e: PointerEvent) => {
      if (!menuOpen) return;
      const t = e.target as Node;
      if (!menuRef.current?.contains(t) && !triggerRef.current?.contains(t)) setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [menuOpen]);

  useEffect(() => {
    document.documentElement.style.overflow = sheetOpen ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [sheetOpen]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const quoteCount = ready ? items.length : 0;

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-[var(--duration-base)] ${
        scrolled || menuOpen ? "border-line bg-canvas" : "border-transparent bg-canvas"
      }`}
    >
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper">
        Skip to content
      </a>
      <div className="container-page flex h-[var(--header-h)] items-center gap-6 md:h-[var(--header-h-md)]">
        <Link href="/" aria-label="Pink Knots — home" className="mr-auto shrink-0 rounded-md lg:mr-0">
          <Wordmark />
        </Link>
        {/* Hairline between the stacked logo and the nav, so the lockup reads as set, not dropped in */}
        <span aria-hidden="true" className="hidden h-9 w-px bg-line-strong lg:block" />

        <nav aria-label="Main" className="-ml-2 hidden items-center gap-1 lg:mr-auto lg:flex">
          <div className="relative" onPointerEnter={openMenu} onPointerLeave={scheduleClose}>
            <button
              ref={triggerRef}
              type="button"
              aria-expanded={menuOpen}
              aria-controls="collections-menu"
              onClick={() => setMenuOpen((v) => !v)}
              className={`flex h-11 items-center gap-1.5 rounded-full px-4 text-[0.9375rem] font-medium transition-colors hover:text-knot ${
                isActive("/collections") || isActive("/products") ? "text-knot" : "text-ink"
              }`}
            >
              Collections
              <ChevronDown size={16} className={`transition-transform duration-[var(--duration-base)] ${menuOpen ? "rotate-180" : ""}`} />
            </button>

            {/* pt-3 is an invisible bridge between trigger and panel so the pointer never "falls out" */}
            <div
              ref={menuRef}
              id="collections-menu"
              hidden={!menuOpen}
              className="absolute top-full left-0 pt-3"
            >
              <div className="grid w-[40rem] grid-cols-[1fr_15rem] overflow-hidden rounded-[var(--radius-card)] border border-line bg-paper shadow-[var(--shadow-menu)]">
                <ul className="grid grid-cols-2 gap-1 p-3">
                  {collections.map((c) => (
                    <li key={c.slug}>
                      <Link
                        href={`/collections/${c.slug}`}
                        aria-current={pathname === `/collections/${c.slug}` ? "page" : undefined}
                        className="group block rounded-lg p-3 transition-colors hover:bg-lilac aria-[current=page]:bg-knot-tint"
                      >
                        <span className="flex items-baseline justify-between gap-2 font-display text-[1.0625rem] font-semibold tracking-[-0.015em] text-ink group-hover:text-knot">
                          {c.name}
                          <span className="font-sans text-xs font-medium text-stone tabular-nums">{c.count}</span>
                        </span>
                        <span className="mt-1 line-clamp-2 block text-[0.8125rem] leading-snug text-stone">{c.blurb}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="surface-dark flex flex-col justify-between bg-ink p-6 text-paper">
                  <div>
                    <p className="eyebrow eyebrow-on-dark">Made to order</p>
                    <p className="mt-3 font-display text-xl leading-tight font-semibold tracking-[-0.02em]">
                      Every piece sized, printed and finished for your occasion.
                    </p>
                  </div>
                  <Link href="/collections" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-paper hover:text-lilac">
                    All collections <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <Link href="/about" aria-current={isActive("/about") ? "page" : undefined} className="flex h-11 items-center rounded-full px-4 text-[0.9375rem] font-medium text-ink transition-colors hover:text-knot aria-[current=page]:text-knot">
            About
          </Link>
          <Link href="/contact" aria-current={isActive("/contact") ? "page" : undefined} className="flex h-11 items-center rounded-full px-4 text-[0.9375rem] font-medium text-ink transition-colors hover:text-knot aria-[current=page]:text-knot">
            Contact
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <a href={site.phone.href} className="hidden items-center gap-2 text-sm font-medium text-ink-soft transition-colors hover:text-knot xl:inline-flex">
            <Phone size={16} /> {site.phone.display}
          </a>
          <Link href="/contact#quote" className="btn btn-primary btn-sm hidden sm:inline-flex">
            Request a quote
            {quoteCount > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-leaf px-1.5 text-xs font-bold text-ink tabular-nums" aria-label={`${quoteCount} items in quote list`}>
                {quoteCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            className="relative grid h-11 w-11 place-items-center rounded-full text-ink transition-colors hover:bg-lilac/60 lg:hidden"
            aria-label="Open menu"
            aria-expanded={sheetOpen}
            aria-controls="mobile-menu"
            onClick={() => setSheetOpen(true)}
          >
            <Menu size={22} />
            {quoteCount > 0 && <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-leaf-deep sm:hidden" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        // Close on any link tap — including a link to the page already open
        onClick={(e) => (e.target as HTMLElement).closest("a") && setSheetOpen(false)}
        className={`fixed inset-0 z-50 flex flex-col bg-canvas transition-[opacity,visibility] duration-[var(--duration-base)] lg:hidden ${
          sheetOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <div className="container-page flex h-[var(--header-h)] items-center justify-between md:h-[var(--header-h-md)]">
          <Wordmark />
          <button type="button" className="grid h-11 w-11 place-items-center rounded-full hover:bg-lilac/60" aria-label="Close menu" onClick={() => setSheetOpen(false)}>
            <Close size={22} />
          </button>
        </div>
        <nav aria-label="Mobile" className="container-page flex-1 overflow-y-auto pt-4 pb-8">
          <p className="eyebrow">Collections</p>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {collections.map((c) => (
              <li key={c.slug}>
                <Link href={`/collections/${c.slug}`} className="flex items-center justify-between py-3.5 font-display text-xl font-semibold tracking-[-0.02em]">
                  {c.name}
                  <span className="font-sans text-sm font-medium text-stone tabular-nums">{c.count}</span>
                </Link>
              </li>
            ))}
          </ul>
          <ul className="mt-6 space-y-1">
            {[
              { href: "/collections", label: "All collections" },
              { href: "/about", label: "About Pink Knots" },
              { href: "/contact", label: "Contact" },
            ].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="block py-2 text-lg font-medium text-ink-soft">{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="container-page grid gap-3 border-t border-line py-4">
          <Link href="/contact#quote" className="btn btn-primary w-full">
            Request a quote{quoteCount > 0 ? ` · ${quoteCount} item${quoteCount > 1 ? "s" : ""}` : ""}
          </Link>
          <a href={site.phone.href} className="btn btn-outline w-full"><Phone size={18} /> Call {site.phone.display}</a>
        </div>
      </div>
    </header>
  );
}
