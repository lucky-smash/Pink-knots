"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "@/components/Icons";
import { GiftBoxIllustration } from "./GiftBoxIllustration";
import { finalCardFraction } from "./heroCard";

type Mode = "pending" | "scroll" | "static";

// Caption windows on the 0..1 timeline: [fade-in start, fully in, fade-out start, gone]
const CAPTIONS: [number, number, number, number][] = [
  [-1, 0, 0.12, 0.22],
  [0.26, 0.32, 0.44, 0.5],
  [0.55, 0.61, 0.72, 0.78],
];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function GiftHero({ productCount, collectionCount }: { productCount: number; collectionCount: number }) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("pending");
  const [sceneReady, setSceneReady] = useState(false);

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
        // By now the camera is inside the box and the frame is already red, so this
        // only evens the lit liner out to flat Knot Red (red over red — nothing turns pink)
        const w = clamp01((p - 0.94) / 0.06);
        const o = w * w * (3 - 2 * w);
        overlayRef.current.style.opacity = String(o);
        // The DOM card takes over from the 3D one at the same spot, then scrolls away with the page
        if (cardRef.current) cardRef.current.style.opacity = String(o);
      }
      if (cueRef.current) cueRef.current.style.opacity = String(1 - clamp01(p / 0.05));
    };

    const frame = (now: number) => {
      raf = 0;
      if (disposed) return;
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      target = readProgress();
      // Critically-damped follow: smooth, but never lags more than a few frames.
      current += (target - current) * (1 - Math.exp(-dt * 12));
      if (Math.abs(target - current) < 0.0004) current = target;
      paintDom(current);
      if (scene) {
        scene.setProgress(current);
        scene.render(dt);
      }
      if (visible && mode === "scroll") raf = requestAnimationFrame(frame);
    };

    const kick = () => {
      if (!raf && !disposed) raf = requestAnimationFrame(frame);
    };

    const resize = () => {
      scene?.setSize(stage.clientWidth, stage.clientHeight);
      if (cardRef.current) cardRef.current.style.width = `${finalCardFraction(stage.clientWidth / stage.clientHeight) * 100}%`;
      kick();
    };

    paintDom(0);

    (async () => {
      const mod = await import("./giftBoxScene");
      if (disposed) return;
      if (!mod.webglAvailable()) {
        // Keep the illustration, and skip the scroll story it can't tell
        if (mode === "scroll") setMode("static");
        return;
      }
      // Wait for display fonts so the canvas wordmarks render in Bricolage/Instrument.
      await document.fonts?.ready;
      if (disposed) return;
      try {
        scene = new mod.GiftBoxScene(canvas, { idle: mode === "scroll" });
      } catch {
        if (mode === "scroll") setMode("static");
        return;
      }
      resize();
      setSceneReady(true);
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
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      scene?.dispose();
    };
  }, [mode]);

  const isScroll = mode !== "static";

  return (
    <section
      ref={sectionRef}
      aria-label="Introduction"
      className={`relative bg-ivory ${isScroll ? "h-[260svh] md:h-[300svh]" : ""}`}
    >
      <div
        ref={stageRef}
        className={`${isScroll ? "sticky top-16 md:top-[4.5rem]" : "relative"} h-[calc(100svh-4rem)] min-h-[34rem] overflow-hidden md:h-[calc(100svh-4.5rem)]`}
      >
        {/* Warm studio backdrop */}
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(120%_80%_at_70%_35%,#fffdf9_0%,#f6f1e9_55%,#ece3d4_100%)]" />

        <div
          aria-hidden="true"
          className={`absolute inset-x-0 top-[6%] bottom-[30%] flex items-center justify-center transition-opacity duration-700 md:inset-y-0 md:right-0 md:left-[38%] md:bottom-0 ${sceneReady ? "opacity-0" : "opacity-100"}`}
        >
          <GiftBoxIllustration className="h-auto w-[min(78vw,26rem)] md:w-[min(40vw,30rem)]" />
        </div>
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${sceneReady ? "opacity-100" : "opacity-0"}`}
        />

        <div className="pointer-events-none relative z-10 container-page flex h-full items-end pb-10 md:items-center md:pb-0">
          <div className="relative w-full max-w-[38rem] md:max-w-[34rem] lg:max-w-[38rem]">
            {/* Caption 1 — the hero */}
            <div ref={(el) => { captionRefs.current[0] = el; }} className="pointer-events-auto will-change-transform">
              <p className="eyebrow">Custom gift packaging · New Delhi · Since 2015</p>
              <h1 className="mt-5 text-hero font-bold text-ink">
                The gift starts with the <span className="accent text-knot">box.</span>
              </h1>
              <p className="mt-6 max-w-[30rem] text-[1.0625rem] leading-relaxed text-ink-soft md:text-lg">
                Wooden trays, printed boxes and hampers for weddings, festivals and corporate gifting — made to your size, logo and design.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/collections" className="btn btn-primary">
                  Explore collections <ArrowRight size={18} />
                </Link>
                <Link href="/contact#quote" className="btn btn-outline">Request a quote</Link>
              </div>
            </div>

            {isScroll && (
              <>
                <div ref={(el) => { captionRefs.current[1] = el; }} className="absolute inset-x-0 bottom-0 opacity-0 md:top-1/2 md:bottom-auto md:-translate-y-1/2" style={{ visibility: "hidden" }}>
                  <p className="eyebrow">Made to order</p>
                  <p className="mt-4 font-display text-display font-bold text-ink">
                    Untie the <span className="accent text-knot">knot.</span>
                  </p>
                  <p className="mt-5 max-w-[26rem] text-lg leading-relaxed text-ink-soft">
                    Sized, printed and finished for your occasion — in wood, MDF, kraft board or leatherette.
                  </p>
                </div>
                <div ref={(el) => { captionRefs.current[2] = el; }} className="absolute inset-x-0 bottom-0 opacity-0 md:top-1/2 md:bottom-auto md:-translate-y-1/2" style={{ visibility: "hidden" }}>
                  <p className="eyebrow">Look inside</p>
                  <p className="mt-4 font-display text-display font-bold text-ink">
                    <span className="tabular-nums">{productCount}</span> designs.<br />
                    <span className="accent text-knot">{collectionCount} collections.</span>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {isScroll && (
          <>
            <div ref={cueRef} className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-xs font-semibold tracking-[0.16em] text-stone uppercase md:flex" aria-hidden="true">
              Scroll to open
              <span className="relative block h-10 w-px overflow-hidden bg-line-strong">
                <span className="absolute inset-x-0 top-0 h-1/2 animate-[cue_1.8s_var(--ease-in-out-soft)_infinite] bg-knot" />
              </span>
            </div>
            <a href="#inside" className="absolute top-5 right-5 z-20 rounded-full bg-paper/80 px-3.5 py-1.5 text-xs font-semibold text-ink-soft backdrop-blur transition-colors hover:text-knot md:right-8">
              Skip intro
            </a>
          </>
        )}

        {/* Settles to flat Knot Red once the camera is inside the box; the next section starts in the same red. */}
        <div ref={overlayRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 bg-knot" style={{ opacity: 0 }} />
        {isScroll && (
          <div
            ref={cardRef}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-1/2 z-30 aspect-[8/5] -translate-x-1/2 -translate-y-1/2 bg-[#f4f1ec] shadow-[0_18px_40px_-12px_rgb(60_8_0/0.55)]"
            style={{ opacity: 0, containerType: "inline-size" }}
          >
            <div className="absolute inset-[6.9%_4.3%] flex flex-col items-center justify-center border-[1.2cqw] border-knot">
              <span className="accent text-[12.5cqw] leading-none text-knot">made for you</span>
              <span className="mt-[4.5cqw] font-display text-[4.3cqw] leading-none font-semibold tracking-[0.06em] text-ink">PINK KNOTS</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
