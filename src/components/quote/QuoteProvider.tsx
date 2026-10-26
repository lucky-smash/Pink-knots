"use client";

// The quote list replaces a shopping cart: Pink Knots sells made-to-order in
// minimum quantities, so visitors collect products and send one enquiry.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type QuoteItem = { slug: string; qty: number };

type QuoteContextValue = {
  items: QuoteItem[];
  ready: boolean;
  has: (slug: string) => boolean;
  add: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
  setQty: (slug: string, qty: number) => void;
  clear: () => void;
};

const QuoteContext = createContext<QuoteContextValue | null>(null);
const STORAGE_KEY = "pk-quote-list";

export function QuoteProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      if (Array.isArray(saved)) setItems(saved.filter((i) => typeof i?.slug === "string" && Number(i?.qty) > 0));
    } catch {
      // storage unavailable (private mode) — the list simply starts empty
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items, ready]);

  const has = useCallback((slug: string) => items.some((i) => i.slug === slug), [items]);
  const add = useCallback(
    (slug: string, qty: number) => setItems((prev) => (prev.some((i) => i.slug === slug) ? prev : [...prev, { slug, qty }])),
    [],
  );
  const remove = useCallback((slug: string) => setItems((prev) => prev.filter((i) => i.slug !== slug)), []);
  const setQty = useCallback(
    (slug: string, qty: number) =>
      setItems((prev) => prev.map((i) => (i.slug === slug ? { ...i, qty: Math.max(1, Math.round(qty) || 1) } : i))),
    [],
  );
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(() => ({ items, ready, has, add, remove, setQty, clear }), [items, ready, has, add, remove, setQty, clear]);
  return <QuoteContext.Provider value={value}>{children}</QuoteContext.Provider>;
}

export function useQuote() {
  const ctx = useContext(QuoteContext);
  if (!ctx) throw new Error("useQuote must be used inside QuoteProvider");
  return ctx;
}
