"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { asset } from "@/lib/asset";
import { ytCopy } from "@/lib/yt/copy";
import { LOADER_HIDDEN_AT, LOADER_OPEN_DELAY, LOADER_OPEN_MS } from "@/lib/yt/introTiming";

const BODY =
  "M27.97 3.12C27.64 1.89 26.68.93 25.45.6 23.22 0 14.27 0 14.27 0S5.32 0 3.09.6C1.86.93.9 1.89.57 3.12 0 5.35 0 10 0 10s0 4.65.57 6.88c.33 1.23 1.29 2.19 2.52 2.52C5.32 20 14.27 20 14.27 20s8.95 0 11.18-.6c1.23-.33 2.19-1.29 2.52-2.52.6-2.23.6-6.88.6-6.88s0-4.65-.6-6.88z";
/** Two wave periods wide, so sliding it left by one period loops seamlessly. */
const WAVE = "M-30 1 q7.5 -2 15 0 t15 0 t15 0 t15 0 V24 H-30 Z";

/** Without a real milestone the bar still creeps to this share over CREEP_MS, so a slow network never looks frozen. */
const CREEP_MAX = 82;
const CREEP_MS = 3200;

/** A feed of faux video thumbnails drifting behind the loader: three rows, alternating directions. */
const FEED = [
  ["#FF3D3D", "#FFB238"],
  ["#2E59E7", "#22D3EE"],
  ["#7C3AED", "#F472B6"],
  ["#16A34A", "#A3E635"],
  ["#111827", "#FF0033"],
  ["#F59E0B", "#EF4444"],
  ["#0EA5E9", "#6366F1"],
  ["#DB2777", "#F59E0B"],
];

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
    root.dataset.live = "";
    const q = <T extends Element>(sel: string) => root.querySelector<T>(sel)!;
    const outline = q<SVGPathElement>("[data-l-outline]");
    const wave = q<SVGGElement>("[data-l-wave]");
    const tri = q<SVGPathElement>("[data-l-tri]");
    const bar = q<HTMLElement>("[data-l-bar]");
    const knob = q<HTMLElement>("[data-l-knob]");
    const trackW = knob.parentElement!.clientWidth;
    const pct = q<HTMLElement>("[data-l-pct]");
    const step = q<HTMLElement>("[data-l-step]");
    const steps = ytCopy.loader.steps;
    const t0 = performance.now();
    let last = t0;
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
      wave.style.transform = `translateY(${(1 - p) * 21 - 0.5}px)`;
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
    raf = requestAnimationFrame(frame);
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
        {[0, 1, 2].map((row) => (
          <div key={row} className="yt-feed-row" style={{ "--row": row } as CSSProperties}>
            {[...FEED, ...FEED].map(([from, to], i) => (
              <span key={i} className="yt-feed-card" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }} />
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
          <svg viewBox="-1 -1 30.57 22" className="relative h-auto w-40 overflow-visible sm:w-48" aria-hidden="true">
            <defs>
              <clipPath id="yt-loader-clip">
                <path d={BODY} />
              </clipPath>
            </defs>
            <path d={BODY} fill="rgb(255 255 255 / 0.04)" />
            <g clipPath="url(#yt-loader-clip)">
              <g data-l-wave style={{ transform: "translateY(20.5px)" }}>
                <path className="yt-loader-wave" d={WAVE} fill="#FF0033" />
              </g>
            </g>
            <path data-l-outline className="yt-loader-outline" d={BODY} fill="none" stroke="#FF0033" strokeWidth="0.5" pathLength={1} strokeDasharray="1" />
            <path data-l-tri d="M11.4 14.29 18.83 10 11.4 5.71z" fill="#FFFFFF" style={{ opacity: 0, transformOrigin: "14.6px 10px" }} />
          </svg>
        </div>
        <p className="yt-loader-fade mt-9 text-xs font-medium uppercase tracking-[0.32em] text-muted">{ytCopy.loader.label}</p>

        <div className="yt-loader-fade mt-7 w-[min(18rem,72vw)]">
          <div className="flex items-end justify-between">
            <span data-l-step className="text-xs text-muted">
              {ytCopy.loader.steps[0]}
            </span>
            <span className="text-2xl font-semibold tabular-nums tracking-tight">
              <span data-l-pct>0</span>
              <span className="ml-0.5 text-sm text-muted">%</span>
            </span>
          </div>
          <div className="relative mt-3 h-1 rounded-full bg-white/10">
            <span data-l-bar className="absolute inset-0 origin-left rounded-full bg-[#FF0033]" style={{ transform: "scaleX(0)" }} />
            <span data-l-knob className="yt-loader-knob absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF0033]" style={{ left: 0 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
