import Link from "next/link";
import type { ReactNode } from "react";

type Crumb = { href: string; label: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-stone">
        {items.map((c, i) => (
          <li key={c.href} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden="true" className="text-line-strong">/</span>}
            {i === items.length - 1 ? (
              <span aria-current="page" className="text-ink-soft">{c.label}</span>
            ) : (
              <Link href={c.href} className="link-draw hover:text-knot">{c.label}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageIntro({ eyebrow, title, children, crumbs, aside }: { eyebrow: string; title: ReactNode; children?: ReactNode; crumbs?: Crumb[]; aside?: ReactNode }) {
  return (
    <header className="border-b border-line">
      <div className="container-page pt-8 pb-12 md:pt-10 md:pb-16">
        {crumbs && <Breadcrumbs items={crumbs} />}
        <div className="mt-8 grid gap-8 md:mt-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="mt-4 text-display font-bold">{title}</h1>
            {children && <div className="mt-5 max-w-2xl text-lead text-ink-soft">{children}</div>}
          </div>
          {aside && <div className="lg:col-span-4 lg:justify-self-end">{aside}</div>}
        </div>
      </div>
    </header>
  );
}
