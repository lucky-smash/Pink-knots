"use client";

import Image from "next/image";
import { useState } from "react";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col gap-3 md:flex-row-reverse">
      <div className="relative aspect-square flex-1 overflow-hidden rounded-[var(--radius-card)] border border-line bg-paper">
        {images.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt={i === 0 ? name : `${name} — view ${i + 1}`}
            fill
            priority={i === 0}
            sizes="(min-width: 1024px) 40rem, 100vw"
            className={`object-contain transition-opacity duration-[var(--duration-base)] ${i === active ? "opacity-100" : "opacity-0"}`}
          />
        ))}
      </div>
      {images.length > 1 && (
        <ul className="flex gap-3 md:w-20 md:flex-col" aria-label="Product photos">
          {images.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show photo ${i + 1} of ${images.length}`}
                aria-pressed={i === active}
                className={`relative block aspect-square w-16 overflow-hidden rounded-lg border-[1.5px] bg-paper transition-colors md:w-20 ${i === active ? "border-knot" : "border-line hover:border-line-strong"}`}
              >
                <Image src={src} alt="" fill sizes="5rem" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
