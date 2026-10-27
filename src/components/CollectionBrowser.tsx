"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

type Item = { slug: string; category: string; price: number | null; card: ReactNode };
type Cat = { slug: string; name: string; count: number; intro: string[] };
type Sort = "default" | "price-asc" | "price-desc";

/** Filters and sorts server-rendered product cards; keeps ?category= in the URL. */
export function CollectionBrowser({ categories, items }: { categories: Cat[]; items: Item[] }) {
  const [active, setActive] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("default");

  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("category");
    if (c && categories.some((x) => x.slug === c)) setActive(c);
  }, [categories]);

  const choose = (slug: string | null) => {
    setActive(slug);
    const url = new URL(window.location.href);
    if (slug) url.searchParams.set("category", slug);
    else url.searchParams.delete("category");
    window.history.replaceState(null, "", url);
  };

  const visible = useMemo(() => {
    const list = active ? items.filter((i) => i.category === active) : items;
    if (sort === "default") return list;
    // Unpriced items always sit at the end
    return [...list].sort((a, b) => {
      if (a.price == null) return 1;
      if (b.price == null) return -1;
      return sort === "price-asc" ? a.price - b.price : b.price - a.price;
    });
  }, [items, active, sort]);

  const activeCat = categories.find((c) => c.slug === active);

  return (
    <div>
      <div className="sticky top-[var(--header-h)] z-30 -mx-[clamp(1rem,0.5rem+2.5vw,2.5rem)] border-b border-line bg-canvas px-[clamp(1rem,0.5rem+2.5vw,2.5rem)] md:top-[var(--header-h-md)]">
        <div className="flex items-center gap-4 py-3">
          <div role="group" aria-label="Filter by category" className="-my-1 flex flex-1 gap-2 overflow-x-auto py-1 pr-6 [mask-image:linear-gradient(to_right,#000_calc(100%-2rem),transparent)] [scrollbar-width:none]">
            <Chip selected={!active} onClick={() => choose(null)}>All · {items.length}</Chip>
            {categories.map((c) => (
              <Chip key={c.slug} selected={active === c.slug} onClick={() => choose(c.slug)}>
                {c.name} · {c.count}
              </Chip>
            ))}
          </div>
          <label className="hidden shrink-0 items-center gap-2 text-sm text-stone md:flex">
            Sort
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="field min-h-10 w-auto py-1.5 pr-8 text-sm">
              <option value="default">Recommended</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </label>
        </div>
      </div>

      {activeCat && activeCat.intro.length > 0 && (
        <div className="mt-8 max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-[-0.02em]">{activeCat.name}</h2>
          {activeCat.intro.length <= 6 && activeCat.intro.every((l) => l.length < 60) ? (
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[0.9375rem] text-stone">
              {activeCat.intro.map((l) => (
                <li key={l} className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-knot" aria-hidden="true" />{l}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 line-clamp-3 text-[0.9375rem] leading-relaxed text-stone">{activeCat.intro.join(" ")}</p>
          )}
        </div>
      )}

      <p className="sr-only" aria-live="polite">{visible.length} products shown</p>
      <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
        {visible.map((i) => (
          <li key={i.slug} className="flex">{i.card}</li>
        ))}
      </ul>
    </div>
  );
}

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`h-9 shrink-0 rounded-full border-[1.5px] px-3.5 text-sm font-medium whitespace-nowrap transition-colors duration-[var(--duration-fast)] ${
        selected ? "border-ink bg-ink text-paper" : "border-line text-ink-soft hover:border-ink hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
