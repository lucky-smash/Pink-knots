"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { ArrowRight, Check, Clipboard, Close, Phone } from "@/components/Icons";
import { KnotMark } from "@/components/Wordmark";
import { useQuote } from "./QuoteProvider";

export type QuoteLookup = Record<string, { name: string; image: string | null; price: string; moq: number | null; category: string }>;

const OCCASIONS = ["Wedding", "Festive / Diwali", "Corporate gifting", "Hotel or hospitality", "Something else"];
const CUSTOM = ["Custom size", "Logo or names", "Custom print / colours", "Special finish (foil, emboss)"];

type Fields = { name: string; company: string; phone: string; email: string; city: string; occasion: string; needBy: string; notes: string };
const EMPTY: Fields = { name: "", company: "", phone: "", email: "", city: "", occasion: "", needBy: "", notes: "" };

export function QuoteForm({ lookup, phone, enquiryUrl }: { lookup: QuoteLookup; phone: { display: string; href: string }; enquiryUrl: string }) {
  const { items, ready, remove, setQty, clear } = useQuote();
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [custom, setCustom] = useState<string[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [summary, setSummary] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const lines = useMemo(() => items.filter((i) => lookup[i.slug]), [items, lookup]);
  const set = (k: keyof Fields) => (e: { target: { value: string } }) => setFields((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!fields.name.trim()) errs.name = "Please tell us your name.";
    if (!/^[+\d][\d\s-]{7,}$/.test(fields.phone.trim())) errs.phone = "Please enter a phone number we can call.";
    if (fields.email && !/^\S+@\S+\.\S+$/.test(fields.email)) errs.email = "That email address doesn’t look right.";
    if (!lines.length && !fields.notes.trim()) errs.notes = "Add products to your list, or describe what you need.";
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.getElementById(`q-${Object.keys(errs)[0]}`)?.focus();
      return;
    }
    const details = [
      `Name: ${fields.name}`,
      fields.company && `Company: ${fields.company}`,
      `Phone: ${fields.phone}`,
      fields.email && `Email: ${fields.email}`,
      fields.city && `City: ${fields.city}`,
      fields.occasion && `Occasion: ${fields.occasion}`,
      fields.needBy && `Needed by: ${fields.needBy}`,
      custom.length > 0 && `Customisation: ${custom.join(", ")}`,
    ].filter(Boolean);
    const blocks = [
      "Enquiry for Pink Knots",
      details.join("\n"),
      lines.length > 0 && ["Products:", ...lines.map((i) => `- ${lookup[i.slug].name} × ${i.qty}`)].join("\n"),
      fields.notes.trim() && `Details: ${fields.notes.trim()}`,
    ].filter(Boolean);
    const text = blocks.join("\n\n");
    setSummary(text);
    setCopied(false);
    requestAnimationFrame(() => document.getElementById("quote-summary")?.focus());
  };

  const copy = async () => {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  if (summary) {
    return (
      <div id="quote-summary" tabIndex={-1} className="rounded-[var(--radius-card)] border border-line bg-paper p-6 outline-none md:p-10">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-knot text-paper"><Check size={24} /></span>
        <h3 className="mt-5 text-title font-bold">Your enquiry is ready to send.</h3>
        <p className="mt-3 max-w-xl text-ink-soft">
          Copy the details below, then paste them into our enquiry form or read them out when you call — whichever is easier.
        </p>
        <pre className="mt-6 max-h-80 overflow-auto rounded-lg border border-line bg-ivory p-5 font-sans text-sm leading-relaxed whitespace-pre-wrap text-ink">{summary}</pre>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={copy} className="btn btn-primary">
            {copied ? <Check size={18} /> : <Clipboard size={18} />} {copied ? "Copied" : "Copy enquiry"}
          </button>
          <a href={enquiryUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline">Open enquiry form <ArrowRight size={18} /></a>
          <a href={phone.href} className="btn btn-outline"><Phone size={18} /> {phone.display}</a>
        </div>
        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-5 text-sm">
          <button type="button" onClick={() => setSummary(null)} className="link-draw font-semibold text-ink-soft">Edit enquiry</button>
          <button type="button" onClick={() => { clear(); setFields(EMPTY); setCustom([]); setSummary(null); }} className="link-draw font-semibold text-ink-soft">
            Start a new enquiry
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-10">
      {/* Quote list */}
      <fieldset>
        <legend className="flex w-full items-baseline justify-between gap-4">
          <span className="text-xl font-semibold tracking-[-0.015em]">Your quote list</span>
          {lines.length > 0 && <span className="text-sm text-stone">{lines.length} item{lines.length > 1 ? "s" : ""}</span>}
        </legend>
        {!ready ? (
          <div className="mt-4 h-24 animate-pulse rounded-[var(--radius-card)] bg-kraft/50" />
        ) : lines.length === 0 ? (
          <div className="mt-4 flex flex-col items-start gap-4 rounded-[var(--radius-card)] border border-dashed border-line-strong p-6 sm:flex-row sm:items-center">
            <KnotMark className="h-10 w-10 shrink-0 opacity-60" />
            <p className="flex-1 text-[0.9375rem] text-stone">
              Your list is empty. Add pieces from any collection with the <strong className="text-ink">+</strong> button — or just describe what you need below.
            </p>
            <Link href="/collections" className="btn btn-outline btn-sm">Browse collections</Link>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-line rounded-[var(--radius-card)] border border-line bg-paper">
            {lines.map((i) => {
              const p = lookup[i.slug];
              return (
                <li key={i.slug} className="flex items-center gap-4 p-3 sm:p-4">
                  <Link href={`/products/${i.slug}`} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-line bg-ivory">
                    {p.image && <Image src={p.image} alt="" fill sizes="4rem" className="object-cover" />}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/products/${i.slug}`} className="block truncate font-semibold hover:text-knot">{p.name}</Link>
                    <p className="truncate text-sm text-stone">{p.price}{p.moq ? ` · min. ${p.moq}` : ""}</p>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-stone">
                    <span className="sr-only sm:not-sr-only">Qty</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={i.qty}
                      onChange={(e) => setQty(i.slug, Number(e.target.value))}
                      className="field min-h-10 w-24 px-3 py-1.5 text-right tabular-nums"
                      aria-label={`Quantity for ${p.name}`}
                    />
                  </label>
                  <button type="button" onClick={() => remove(i.slug)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-stone hover:bg-ivory hover:text-knot" aria-label={`Remove ${p.name}`}>
                    <Close size={18} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </fieldset>

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-1 text-xl font-semibold tracking-[-0.015em] sm:col-span-2">About you</legend>
        <Field id="name" label="Your name" required error={errors.name}>
          <input id="q-name" className="field" autoComplete="name" value={fields.name} onChange={set("name")} aria-invalid={!!errors.name} aria-describedby={errors.name ? "q-name-err" : undefined} />
        </Field>
        <Field id="company" label="Company" hint="Optional">
          <input id="q-company" className="field" autoComplete="organization" value={fields.company} onChange={set("company")} />
        </Field>
        <Field id="phone" label="Phone" required error={errors.phone}>
          <input id="q-phone" className="field" type="tel" autoComplete="tel" value={fields.phone} onChange={set("phone")} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "q-phone-err" : undefined} />
        </Field>
        <Field id="email" label="Email" hint="Optional" error={errors.email}>
          <input id="q-email" className="field" type="email" autoComplete="email" value={fields.email} onChange={set("email")} aria-invalid={!!errors.email} aria-describedby={errors.email ? "q-email-err" : undefined} />
        </Field>
        <Field id="city" label="City">
          <input id="q-city" className="field" autoComplete="address-level2" value={fields.city} onChange={set("city")} />
        </Field>
        <Field id="needBy" label="Needed by" hint="Optional">
          <input id="q-needBy" className="field" type="date" value={fields.needBy} onChange={set("needBy")} />
        </Field>
      </fieldset>

      <fieldset>
        <legend className="text-xl font-semibold tracking-[-0.015em]">The occasion</legend>
        <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Occasion">
          {OCCASIONS.map((o) => (
            <label key={o} className="cursor-pointer">
              <input type="radio" name="occasion" value={o} checked={fields.occasion === o} onChange={set("occasion")} className="peer sr-only" />
              <span className="inline-flex h-10 items-center rounded-full border-[1.5px] border-line px-4 text-sm font-medium text-ink-soft transition-colors peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-knot hover:border-ink">
                {o}
              </span>
            </label>
          ))}
        </div>
        <p className="mt-6 text-sm font-medium text-ink-soft">What would you like customised?</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {CUSTOM.map((c) => (
            <label key={c} className="flex cursor-pointer items-center gap-3 rounded-lg border border-line bg-paper px-4 py-3 text-[0.9375rem] transition-colors hover:border-line-strong has-[:checked]:border-knot has-[:checked]:bg-knot-tint">
              <input
                type="checkbox"
                checked={custom.includes(c)}
                onChange={(e) => setCustom((prev) => (e.target.checked ? [...prev, c] : prev.filter((x) => x !== c)))}
                className="h-4 w-4 accent-[var(--color-knot)]"
              />
              {c}
            </label>
          ))}
        </div>
        <div className="mt-6">
          <Field id="notes" label="Anything else?" hint="Sizes, quantities, colours, budget, delivery city…" error={errors.notes}>
            <textarea id="q-notes" rows={5} className="field resize-y" value={fields.notes} onChange={set("notes")} aria-invalid={!!errors.notes} aria-describedby={errors.notes ? "q-notes-err" : undefined} />
          </Field>
        </div>
      </fieldset>

      <div className="flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-md text-sm text-stone">Most pieces start from a minimum order of 50. We’ll confirm specifications, quantity and pricing with you.</p>
        <button type="submit" className="btn btn-primary">Prepare enquiry <ArrowRight size={18} /></button>
      </div>
    </form>
  );
}

function Field({ id, label, hint, required, error, children }: { id: string; label: string; hint?: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={`q-${id}`} className="mb-1.5 flex items-baseline justify-between gap-3 text-sm font-medium text-ink">
        <span>{label}{required && <span className="text-knot" aria-hidden="true"> *</span>}</span>
        {hint && <span className="text-xs font-normal text-stone">{hint}</span>}
      </label>
      {children}
      {error && <p id={`q-${id}-err`} className="mt-1.5 text-sm font-medium text-knot">{error}</p>}
    </div>
  );
}
