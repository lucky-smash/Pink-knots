"use client";

import { useState } from "react";
import { Play } from "@/components/Icons";
import { KnotMark } from "@/components/Wordmark";

/** Click-to-load YouTube embed: nothing is fetched from YouTube until the visitor asks. */
export function VideoEmbed({ id, title }: { id: string; title: string }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative aspect-video overflow-hidden rounded-[var(--radius-card)] bg-ink">
      {playing ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0 flex flex-col items-center justify-center gap-5 text-paper">
          <KnotMark className="absolute top-6 left-6 h-8 w-8" color="var(--color-paper)" />
          <span className="grid h-20 w-20 place-items-center rounded-full bg-knot shadow-[0_16px_40px_-12px_rgb(178_32_154/0.8)] transition-transform duration-[var(--duration-base)] ease-[var(--ease-out-soft)] group-hover:scale-110">
            <Play size={30} className="translate-x-0.5" />
          </span>
          <span className="font-display text-xl font-semibold tracking-[-0.015em]">{title}</span>
          <span className="text-xs text-paper/55">Plays from YouTube</span>
        </button>
      )}
    </div>
  );
}
