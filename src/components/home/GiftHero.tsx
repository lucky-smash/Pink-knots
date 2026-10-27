"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "@/components/Icons";
import { GiftBoxIllustration } from "./GiftBoxIllustration";
import { CARD_RENDERED, HANDOFF, SETTLED, drawCard, finalCardFraction } from "./heroCard";

type Mode = "pending" | "scroll" | "static";

// Caption windows on the 0..1 timeline: [fade-in start, fully in, fade-out start, gone]
const CAPTIONS: [number, number, number, number][] = [
  [-1, 0, 0.3, 0.38], // the hero copy stays while the logo becomes the ribbon (scene MORPH_END)
  [0.4, 0.45, 0.52, 0.58],
  [0.6, 0.65, 0.73, 0.79],
];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// The scene's resting first frame, saved from the last visit (GiftBoxScene.snapshot), so a reload
// opens on the same box the scene then takes over from. Keyed by stage size and pixel ratio
// (same cap as the renderer), since it only lines up with a canvas of the same size.
const SNAPSHOT_KEY = "pk-hero-box-v3"; // bump when the first frame changes, so no stale box shows

// Reduced motion / low power: no scroll story, so the ribbon holds one shape — far enough along
// to have its satin depth, early enough that its outline is still plainly the logo's
const STILL_MORPH = 0.55;
const stageSizeKey = (stage: HTMLElement) => `${stage.clientWidth}x${stage.clientHeight}@${Math.min(window.devicePixelRatio, 1.75)}`;

export function GiftHero({ productCount, collectionCount }: { productCount: number; collectionCount: number }) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const cardCanvasRef = useRef<HTMLCanvasElement>(null);
  const cardShadowRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const snapshotRef = useRef<HTMLImageElement>(null);
  const [mode, setMode] = useState<Mode>("pending");
  const [noWebgl, setNoWebgl] = useState(false);

  // Decide once on mount: full scroll story, or a calm static hero.
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
    const lowPower = (nav.hardwareConcurrency ?? 4) <= 2 || nav.connection?.saveData === true;
    setMode(reduced || lowPower ? "static" : "scroll");
  }, []);

  useEffect(() => {
    if (mode === "pending") return;
    const section = sectionRef.current!;
    const stage = stageRef.current!;
    const canvas = canvasRef.current!;
    let disposed = false;
    let raf = 0;
    let visible = true;
    let target = 0;
    let current = 0;
    let last = performance.now();
    let scene: import("./giftBoxScene").GiftBoxScene | null = null;
    let revealed = false;
    let saveTimer = 0;

    const readProgress = () => {
      if (mode === "static") return 0;
      const rect = section.getBoundingClientRect();
      const stickyTop = parseFloat(getComputedStyle(stage).top) || 0;
      const distance = section.offsetHeight - stage.offsetHeight;
      return distance > 0 ? clamp01((stickyTop - rect.top) / distance) : 0;
    };

    const paintDom = (p: number) => {
      CAPTIONS.forEach(([a, b, c, d], i) => {
        const el = captionRefs.current[i];
        if (!el) return;
        const o = mode === "static" ? (i === 0 ? 1 : 0) : p < b ? clamp01((p - a) / (b - a)) : 1 - clamp01((p - c) / (d - c));
        el.style.opacity = String(o);
        el.style.transform = `translate3d(0, ${(1 - o) * (p < b ? 24 : -24)}px, 0)`;
        el.style.visibility = o < 0.01 ? "hidden" : "visible";
        el.inert = o < 0.5;
      });
      if (overlayRef.current) {
        // By now the camera is inside the box and the frame is the magenta liner; this fades it
        // out to the flat lilac the next section starts in
        const w = clamp01((p - HANDOFF) / (SETTLED - HANDOFF));
        const o = w * w * (3 - 2 * w);
        overlayRef.current.style.opacity = String(o);
        // The DOM card replaces the 3D one outright (the scene hides its card at the same p), so
        // the overlay only ever fades behind an opaque card. Only its lift shadow fades in.
        if (cardRef.current) cardRef.current.style.visibility = p >= HANDOFF ? "visible" : "hidden";
        if (cardShadowRef.current) cardShadowRef.current.style.opacity = String(o);
      }
      if (cueRef.current) cueRef.current.style.opacity = String(1 - clamp01(p / 0.05));
    };

    const frame = (now: number) => {
      raf = 0;
      if (disposed) return;
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      target = readProgress();
      // Critically-damped follow: smooth, but never lags more than a few frames. It tightens
      // through the landing so the card hand-off is done before the stage scrolls away.
      current += (target - current) * (1 - Math.exp(-dt * (target > HANDOFF - 0.1 ? 24 : 12)));
      if (Math.abs(target - current) < 0.0004) current = target;
      paintDom(current);
      if (scene) {
        scene.setProgress(current);
        scene.render();
        if (!revealed) {
          // Swap in the live canvas on the frame it first draws, so the snapshot never gives way to a blank
          revealed = true;
          canvas.style.opacity = "1";
          snap.style.visibility = "hidden";
        }
      }
      // Nothing moves on its own: once the follow has caught up, stop until the next scroll
      if (visible && mode === "scroll" && current !== target) raf = requestAnimationFrame(frame);
    };

    const kick = () => {
      if (!raf && !disposed) raf = requestAnimationFrame(frame);
    };

    const resize = () => {
      scene?.setSize(stage.clientWidth, stage.clientHeight);
      if (scene) queueSnapshot();
      if (cardRef.current) cardRef.current.style.width = `${finalCardFraction(stage.clientWidth / stage.clientHeight) * 100}%`;
      kick();
    };

    // A reload at the top opens on last visit's first frame; otherwise the canvas fades in
    const snap = snapshotRef.current!;
    try {
      const saved = JSON.parse(localStorage.getItem(SNAPSHOT_KEY) ?? "null") as { size: string; src: string } | null;
      if (saved?.size === stageSizeKey(stage) && readProgress() === 0) {
        snap.src = saved.src;
        snap.style.visibility = "visible";
        canvas.style.transition = "none";
      }
    } catch {}

    const saveSnapshot = () => {
      if (disposed || !scene) return;
      try {
        localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ size: stageSizeKey(stage), src: scene.snapshot() }));
      } catch {}
    };
    const queueSnapshot = () => {
      clearTimeout(saveTimer);
      saveTimer = window.setTimeout(saveSnapshot, 1500);
    };

    paintDom(0);
    document.fonts?.ready.then(() => {
      if (!disposed && cardCanvasRef.current) drawCard(cardCanvasRef.current, CARD_RENDERED);
    });

    (async () => {
      const mod = await import("./giftBoxScene");
      if (disposed) return;
      if (!mod.webglAvailable()) {
        // Show the illustration, and skip the scroll story it can't tell
        setNoWebgl(true);
        if (mode === "scroll") setMode("static");
        return;
      }
      // Wait for display fonts so the canvas wordmarks render in Bricolage/Instrument.
      await document.fonts?.ready;
      if (disposed) return;
      try {
        scene = new mod.GiftBoxScene(canvas, mode === "static" ? { morph: STILL_MORPH } : {});
      } catch {
        setNoWebgl(true);
        if (mode === "scroll") setMode("static");
        return;
      }
      resize();
      kick();
    })();

    const ro = new ResizeObserver(resize);
    ro.observe(stage);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) {
        last = performance.now();
        kick();
      }
    });
    io.observe(section);
    const onScroll = () => kick();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      clearTimeout(saveTimer);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      scene?.dispose();
    };
  }, [mode]);

  const isScroll = mode !== "static";
  const boxIllustration = (
    <div
      aria-hidden="true"
      className="absolute inset-x-0 top-[6%] bottom-[30%] flex items-center justify-center md:[@container(min-aspect-ratio:9/10)]:inset-y-0 md:[@container(min-aspect-ratio:9/10)]:right-0 md:[@container(min-aspect-ratio:9/10)]:left-[38%] md:[@container(min-aspect-ratio:9/10)]:bottom-0"
    >
      <GiftBoxIllustration className="h-auto w-[min(78vw,26rem)] md:[@container(min-aspect-ratio:9/10)]:w-[min(40vw,30rem)]" />
    </div>
  );

  return (
    <section
      ref={sectionRef}
      aria-label="Introduction"
      className={`relative bg-canvas ${isScroll ? "h-[290svh] md:h-[340svh]" : ""}`}
    >
      <div
        ref={stageRef}
        className={`${isScroll ? "sticky top-[var(--header-h)] md:top-[var(--header-h-md)]" : "relative"} h-[calc(100svh-var(--header-h))] min-h-[min(34rem,calc(100svh-var(--header-h)))] overflow-hidden [container-type:size] md:h-[calc(100svh-var(--header-h-md))]`}
      >
        {/* Warm studio backdrop */}
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(110%_80%_at_68%_38%,var(--color-studio-light)_0%,var(--color-studio)_55%,var(--color-studio-deep)_100%)]" />

        {/* The flat illustration stands in only where the scene can't run (no WebGL, or no JS) */}
        {noWebgl && boxIllustration}
        <noscript>{boxIllustration}</noscript>
        {/* eslint-disable-next-line @next/next/no-img-element -- a data URL of the last visit's first frame, not an optimisable asset */}
        <img ref={snapshotRef} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full" style={{ visibility: "hidden" }} />
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-700" />

        {/* Copy sits under the box until the stage is landscape — the same aspect test the scene frames with */}
        <div className="pointer-events-none relative z-10 container-page flex h-full items-end pb-10 md:[@container(min-aspect-ratio:9/10)]:items-center md:[@container(min-aspect-ratio:9/10)]:pb-0">
          {/* Sideways on a phone the box starts ~56% across, so the column stops short of it */}
          <div className="relative w-full max-w-[38rem] md:max-w-[30rem] xl:max-w-[34rem] short:md:max-w-[27rem]">
            {/* Caption 1 — the hero */}
            <div ref={(el) => { captionRefs.current[0] = el; }} className="pointer-events-auto will-change-transform">
              {/* One line on phones, where the box above needs the height */}
              <p className="eyebrow">Custom gift packaging · New Delhi<span className="max-sm:hidden"> · Since 2015</span></p>
              <h1 className="mt-3 text-hero font-bold text-ink sm:mt-5 short:mt-2">
                The gift starts with the <span className="accent text-knot-light">box.</span>
              </h1>
              <p className="mt-4 max-w-[30rem] text-lead text-ink-soft max-[374px]:text-[0.9375rem] sm:mt-6 short:mt-2 short:text-[0.9375rem]">
                Wooden trays, printed boxes and hampers for weddings, festivals and corporate gifting — made to your size, logo and design.
              </p>
              {/* Side by side on phones too: a touch smaller (still 44px tall) so both fit one row */}
              <div className="mt-6 flex flex-wrap gap-2.5 sm:mt-8 sm:gap-3 short:mt-4">
                <Link href="/collections" className="btn btn-primary max-sm:min-h-11 max-sm:gap-1.5 max-sm:px-4 max-sm:text-sm max-[374px]:px-3.5 max-[374px]:[&>svg]:hidden">
                  Explore collections <ArrowRight size={16} />
                </Link>
                <Link href="/contact#quote" className="btn btn-outline max-sm:min-h-11 max-sm:px-4 max-sm:text-sm max-[374px]:px-3.5">Request a quote</Link>
              </div>
            </div>

            {isScroll && (
              <>
                <div ref={(el) => { captionRefs.current[1] = el; }} className="absolute inset-x-0 bottom-0 opacity-0 md:[@container(min-aspect-ratio:9/10)]:top-1/2 md:[@container(min-aspect-ratio:9/10)]:bottom-auto md:[@container(min-aspect-ratio:9/10)]:-translate-y-1/2" style={{ visibility: "hidden" }}>
                  <p className="eyebrow">Made to order</p>
                  <p className="mt-4 font-display text-display font-bold text-ink">
                    Lift the <span className="accent text-knot-light">lid.</span>
                  </p>
                  <p className="mt-5 max-w-[26rem] text-lg leading-relaxed text-ink-soft">
                    Sized, printed and finished for your occasion — in wood, MDF, kraft board or leatherette.
                  </p>
                </div>
                <div ref={(el) => { captionRefs.current[2] = el; }} className="absolute inset-x-0 bottom-0 opacity-0 md:[@container(min-aspect-ratio:9/10)]:top-1/2 md:[@container(min-aspect-ratio:9/10)]:bottom-auto md:[@container(min-aspect-ratio:9/10)]:-translate-y-1/2" style={{ visibility: "hidden" }}>
                  <p className="eyebrow">Look inside</p>
                  <p className="mt-4 font-display text-display font-bold text-ink">
                    <span className="tabular-nums">{productCount}</span> designs.<br />
                    <span className="accent text-leaf-dark">{collectionCount} collections.</span>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {isScroll && (
          <div ref={cueRef} className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-xs font-semibold tracking-[0.16em] text-stone uppercase md:[@container(min-aspect-ratio:9/10)]:flex short:hidden!" aria-hidden="true">
            Scroll to open
            <span className="relative block h-10 w-px overflow-hidden bg-line-strong">
              <span className="absolute inset-x-0 top-0 h-1/2 animate-[cue_1.8s_var(--ease-in-out-soft)_infinite] bg-knot" />
            </span>
          </div>
        )}

        {/* Settles to flat lilac once the camera is inside the box; the next section starts in the same
            lilac and knot tile. Anchoring the tile to the bottom edge carries its repeat across the seam. */}
        <div ref={overlayRef} aria-hidden="true" data-knots-anchor="end" className="knots-lilac pointer-events-none absolute inset-0 z-20 bg-lilac" style={{ opacity: 0 }} />
        {isScroll && (
          <div
            ref={cardRef}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-1/2 z-30 aspect-[8/5] -translate-x-1/2 -translate-y-1/2"
            style={{ visibility: "hidden" }}
          >
            <div ref={cardShadowRef} className="absolute inset-0 shadow-[0_18px_40px_-12px_rgb(50_0_45/0.55)]" style={{ opacity: 0 }} />
            {/* Drawn with the same routine as the scene's card texture */}
            <canvas ref={cardCanvasRef} width={1024} height={640} className="relative block h-full w-full" />
          </div>
        )}
      </div>
    </section>
  );
}
