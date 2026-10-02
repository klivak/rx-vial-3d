"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { asset } from "@/lib/asset";
import { ytCopy } from "@/lib/yt/copy";
import { LOADER_HIDDEN_AT, LOADER_OPEN_DELAY, LOADER_OPEN_MS } from "@/lib/yt/introTiming";

/**
 * The YouTube body as plain cubics, clockwise from the top centre (where the outline starts drawing). No zero-length handles: the
 * stock path had them at the top and bottom centres, which left a one-pixel nick in the stroke.
 */
const BODY =
  "M14.27 0C18.5 0 23.22 0 25.45.6 26.68.93 27.64 1.89 27.97 3.12 28.57 5.35 28.57 7.7 28.57 10 28.57 12.3 28.57 14.65 27.97 16.88 27.64 18.11 26.68 19.07 25.45 19.4 23.22 20 18.5 20 14.27 20 10.04 20 5.32 20 3.09 19.4 1.86 19.07.9 18.11.57 16.88 0 14.65 0 12.3 0 10 0 7.7 0 5.35.57 3.12.9 1.89 1.86.93 3.09.6 5.32 0 10.04 0 14.27 0Z";
/** Two wave periods wide, so sliding it left by one period loops seamlessly. */
const WAVE = "M-30 1 q7.5 -2 15 0 t15 0 t15 0 t15 0 V24 H-30 Z";
/** The same crest as a line: the lit surface of the liquid. */
const WAVE_SURFACE = "M-30 1 q7.5 -2 15 0 t15 0 t15 0 t15 0";
/**
 * Liquid offset at 0 % and 100 %. The crest spans 2 units, so full must lift it past the top edge (the old -0.5 left an empty sliver
 * in the corner) and empty must sink it below the bottom. Keep in sync with the pre-hydration rule in youtube.css.
 */
const WAVE_EMPTY = 20.5;
const WAVE_FULL = -2;
const TRIANGLE = "M11.4 14.29 18.83 10 11.4 5.71z";
/** Bubbles: x, radius, rise time (s). They rise inside the liquid and fade before the surface. */
const BUBBLES: Array<[number, number, number]> = [
  [5.5, 0.42, 3.1],
  [10.5, 0.28, 2.5],
  [16, 0.5, 3.6],
  [20.5, 0.32, 2.8],
  [24.2, 0.38, 3.3],
];

/** Without a real milestone the bar still creeps to this share over CREEP_MS, so a slow network never looks frozen. */
const CREEP_MAX = 82;
const CREEP_MS = 3200;

/** A feed of faux video thumbnails drifting behind the loader: rows in alternating directions. */
const FEED_ROWS = [0, 1, 2, 3, 4, 5];
/** One run of cards is 18 × 238px ≈ 4.3k px, wider than a 4K screen, so the doubled run never shows its end while it slides by one run. */
const FEED_CARDS = 18;
/**
 * Every card in the feed gets its own colour: hues step by the golden angle across all 108 cards, so no two cards (in a row or
 * between rows) match, and saturation, lightness and the hue spread of each gradient vary so the rows don't read as one palette.
 */
const feedCard = (row: number, i: number) => {
  const k = row * FEED_CARDS + i;
  const h = (k * 137.508) % 360;
  const s = 62 + ((k * 37) % 30);
  const l = 44 + ((k * 23) % 16);
  const spread = 28 + ((k * 53) % 60);
  return `linear-gradient(${115 + row * 12}deg, hsl(${h.toFixed(1)} ${s}% ${l}%), hsl(${((h + spread) % 360).toFixed(1)} ${s + 8}% ${l + 10}%))`;
};
const feedRow = (row: number) => Array.from({ length: FEED_CARDS }, (_, i) => feedCard(row, i));

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Full-screen loader: a video feed drifts behind, the play button draws its outline and fills with red liquid as the page loads,
 * the status line changes with each stage. When everything is ready the button presses, two rings run out and the page opens
 * as a circle from the button. Progress follows real milestones (`target`), eased and written straight to the DOM every frame.
 * Before hydration the outline already runs a CSS loop, so the first paint is never static.
 */
export function YtLoader({ target, done }: { target: number; done: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const shown = useRef(0);
  const goal = useRef({ target, done });
  goal.current = { target, done };

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    // Pick up where the pre-hydration CSS creep (--lp) got to, and shift t0 so the JS creep continues along the same curve.
    const css = parseFloat(getComputedStyle(root).getPropertyValue("--lp"));
    const from = Math.max(shown.current, Number.isFinite(css) ? Math.min(css, CREEP_MAX) : 0);
    shown.current = from;
    const q = <T extends Element>(sel: string) => root.querySelector<T>(sel)!;
    const outline = q<SVGGElement>("[data-l-outline]");
    const wave = q<SVGGElement>("[data-l-wave]");
    const tri = q<SVGGElement>("[data-l-tri]");
    const halo = q<HTMLElement>(".yt-loader-halo");
    const bar = q<HTMLElement>("[data-l-bar]");
    const knob = q<HTMLElement>("[data-l-knob]");
    const trackW = knob.parentElement!.clientWidth;
    const pct = q<HTMLElement>("[data-l-pct]");
    const step = q<HTMLElement>("[data-l-step]");
    const steps = ytCopy.loader.steps;
    pct.textContent = String(Math.round(from));
    root.dataset.live = "";
    let last = performance.now();
    const t0 = last - (1 - Math.sqrt(1 - Math.min(from, CREEP_MAX) / CREEP_MAX)) * CREEP_MS;
    let raf = 0;

    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const { target: t, done: d } = goal.current;
      const creep = CREEP_MAX * (1 - Math.pow(1 - clamp01((now - t0) / CREEP_MS), 2));
      const aim = d ? 100 : Math.min(96, Math.max(t, creep));
      shown.current += (aim - shown.current) * (1 - Math.exp(-dt * (d ? 9 : 3.5)));
      if (d && aim - shown.current < 0.2) shown.current = 100;
      const p = shown.current / 100;

      // Outline draws over the first half; the liquid rises from empty to full over the whole run; the triangle grows in last.
      outline.style.strokeDashoffset = String(1 - clamp01(p / 0.5));
      wave.style.transform = `translateY(${WAVE_EMPTY + (WAVE_FULL - WAVE_EMPTY) * p}px)`;
      halo.style.setProperty("--fill", p.toFixed(3));
      const tp = clamp01((p - 0.7) / 0.28);
      tri.style.transform = `scale(${0.3 + 0.7 * (1 - Math.pow(1 - tp, 3))})`;
      tri.style.opacity = String(tp);
      bar.style.transform = `scaleX(${p})`;
      // A transform on top of the centring `translate` utilities: moving `left` re-ran layout every frame.
      knob.style.transform = `translateX(${(p * trackW).toFixed(1)}px)`;
      pct.textContent = String(Math.round(p * 100));
      const next = p >= 1 ? steps[3] : steps[Math.min(2, Math.floor(p * 3))];
      if (step.textContent !== next) {
        step.textContent = next;
        step.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 380, easing: "cubic-bezier(0.16, 1, 0.3, 1)" });
      }
      if (p < 1) raf = requestAnimationFrame(frame);
    };
    // Synchronously, so the inline styles take over from the CSS creep in the same frame.
    frame(last);
    return () => cancelAnimationFrame(raf);
  }, [done]);

  // The page opens as a circle from the centre of the button.
  useEffect(() => {
    const root = rootRef.current;
    const mark = root?.querySelector("[data-l-mark]");
    if (!done || !root || !mark) return;
    const r = mark.getBoundingClientRect();
    root.style.setProperty("--hx", `${r.left + r.width / 2}px`);
    root.style.setProperty("--hy", `${r.top + r.height / 2}px`);
  }, [done]);

  return (
    <div
      ref={rootRef}
      role="progressbar"
      aria-label="Loading"
      aria-valuemin={0}
      aria-valuemax={100}
      style={{ "--l-open-delay": `${LOADER_OPEN_DELAY}ms`, "--l-open-ms": `${LOADER_OPEN_MS}ms`, "--l-hidden-at": `${LOADER_HIDDEN_AT}ms` } as CSSProperties}
      className={`yt-loader loader fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-background ${done ? "is-done" : ""}`}
    >
      <div className="yt-backdrop absolute inset-0" aria-hidden="true" />
      <div className="yt-feed absolute inset-0" aria-hidden="true">
        {FEED_ROWS.map((row) => (
          <div key={row} className="yt-feed-row" style={{ "--row": row } as CSSProperties}>
            {[...feedRow(row), ...feedRow(row)].map((background, i) => (
              <span key={i} className="yt-feed-card" style={{ background }} />
            ))}
          </div>
        ))}
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset("/yt/air-logo.svg")} alt="AIR" width={157} height={31} className="yt-loader-fade absolute left-1/2 top-10 h-5 w-auto -translate-x-1/2 opacity-80" />

      <div className="relative flex flex-col items-center">
        <span className="yt-loader-halo yt-loader-fade" aria-hidden="true" />
        <div data-l-mark className="yt-loader-mark relative">
          <span className="yt-loader-ring" aria-hidden="true" />
          <span className="yt-loader-ring is-late" aria-hidden="true" />
          {/* A glass vessel filling with red: two liquid layers with a lit surface line and rising bubbles, an inner rim for depth,
              a top gloss and a slow sheen over everything, then the triangle with a soft shadow. Gradients and transforms only. */}
          <svg viewBox="-1 -1 30.57 22" className="relative h-auto w-40 overflow-visible sm:w-48" aria-hidden="true">
            <defs>
              <clipPath id="yt-loader-clip">
                <path d={BODY} />
              </clipPath>
              <linearGradient id="yt-l-glass" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#fff" stopOpacity="0.07" />
                <stop offset="1" stopColor="#fff" stopOpacity="0.015" />
              </linearGradient>
              {/* In the liquid's own coordinates, so the surface is always the brightest part and the colour deepens below it. */}
              <linearGradient id="yt-l-liquid" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="21">
                <stop offset="0" stopColor="#FF3D63" />
                <stop offset="0.35" stopColor="#FF0033" />
                <stop offset="1" stopColor="#B8002A" />
              </linearGradient>
              <linearGradient id="yt-l-gloss" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#fff" stopOpacity="0.18" />
                <stop offset="1" stopColor="#fff" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="yt-l-floor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#000" stopOpacity="0" />
                <stop offset="1" stopColor="#000" stopOpacity="0.28" />
              </linearGradient>
              <linearGradient id="yt-l-sheen" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#fff" stopOpacity="0" />
                <stop offset="0.5" stopColor="#fff" stopOpacity="0.2" />
                <stop offset="1" stopColor="#fff" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="yt-l-rim" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#FF6B86" />
                <stop offset="0.5" stopColor="#FF0033" />
                <stop offset="1" stopColor="#E0002D" />
              </linearGradient>
              <linearGradient id="yt-l-tri" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#fff" />
                <stop offset="1" stopColor="#FFE1E7" />
              </linearGradient>
            </defs>
            <path d={BODY} fill="url(#yt-l-glass)" />
            <g clipPath="url(#yt-loader-clip)">
              <g data-l-wave style={{ transform: `translateY(${WAVE_EMPTY}px)` }}>
                <g style={{ transform: "translateY(-0.7px)" }}>
                  <path className="yt-loader-wave is-back" d={WAVE} fill="#9E0024" />
                </g>
                <g className="yt-loader-wave">
                  <path d={WAVE} fill="url(#yt-l-liquid)" />
                  <path d={WAVE_SURFACE} fill="none" stroke="#FF9AAE" strokeWidth="0.32" strokeOpacity="0.75" />
                </g>
                {BUBBLES.map(([x, r, s], i) => (
                  <circle key={i} className="yt-loader-bubble" cx={x} cy="19.5" r={r} style={{ "--s": `${s}s`, "--d": `${-i * 0.73}s` } as CSSProperties} />
                ))}
              </g>
              <rect x="0" y="12" width="28.57" height="8" fill="url(#yt-l-floor)" />
              <path d={BODY} fill="none" stroke="#5A0016" strokeOpacity="0.45" strokeWidth="1.6" />
              <rect x="0" y="0" width="28.57" height="8.5" fill="url(#yt-l-gloss)" />
              <path d="M3.2 1.5Q14.3.7 25.4 1.5" fill="none" stroke="#fff" strokeOpacity="0.3" strokeWidth="0.25" strokeLinecap="round" />
              <g className="yt-loader-sheen">
                <rect x="-7" y="-2" width="5" height="25" fill="url(#yt-l-sheen)" transform="skewX(-18)" />
              </g>
            </g>
            {/* Outline: a soft wide stroke under a crisp one. The dash offset is set on the group and inherited by both. */}
            <g data-l-outline className="yt-loader-outline" fill="none" strokeLinejoin="round" strokeLinecap="round">
              <path d={BODY} stroke="#FF0033" strokeOpacity="0.28" strokeWidth="1.3" pathLength={1} strokeDasharray="1" />
              <path d={BODY} stroke="url(#yt-l-rim)" strokeWidth="0.5" pathLength={1} strokeDasharray="1" />
            </g>
            <g data-l-tri style={{ opacity: 0, transformOrigin: "14.6px 10px" }}>
              <path d={TRIANGLE} fill="#6E0018" fillOpacity="0.35" transform="translate(0.15 0.45)" />
              <path d={TRIANGLE} fill="url(#yt-l-tri)" />
            </g>
          </svg>
        </div>
        <p className="yt-loader-fade mt-9 flex items-center gap-2.5 text-[11px] font-medium uppercase tracking-[0.34em] text-muted">
          <span className="yt-loader-dot" aria-hidden="true" />
          {ytCopy.loader.label}
        </p>

        <div className="yt-loader-fade yt-loader-panel mt-6 w-[min(19rem,76vw)] px-5 pb-5 pt-4">
          <div className="flex items-end justify-between gap-4">
            <span data-l-step className="pb-1 text-xs text-foreground/70">
              {ytCopy.loader.steps[0]}
            </span>
            <span className="yt-loader-pct text-3xl font-light tabular-nums leading-none tracking-tight">
              <span data-l-pct />
              <span className="ml-0.5 align-top text-xs font-medium text-muted">%</span>
            </span>
          </div>
          <div className="yt-loader-track relative mt-4 h-[3px]">
            <span data-l-bar className="yt-loader-bar absolute inset-0 origin-left" style={{ transform: "scaleX(0)" }} />
            <span data-l-knob className="yt-loader-knob absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" style={{ left: 0 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
