"use client";

import { useEffect, useRef } from "react";
import { asset } from "@/lib/asset";
import { ytCopy } from "@/lib/yt/copy";

const BODY =
  "M27.97 3.12C27.64 1.89 26.68.93 25.45.6 23.22 0 14.27 0 14.27 0S5.32 0 3.09.6C1.86.93.9 1.89.57 3.12 0 5.35 0 10 0 10s0 4.65.57 6.88c.33 1.23 1.29 2.19 2.52 2.52C5.32 20 14.27 20 14.27 20s8.95 0 11.18-.6c1.23-.33 2.19-1.29 2.52-2.52.6-2.23.6-6.88.6-6.88s0-4.65-.6-6.88z";

/** Without a real milestone the bar still creeps to this share over CREEP_MS, so a slow network never looks frozen. */
const CREEP_MAX = 82;
const CREEP_MS = 3200;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Full-screen loader dressed as a video player buffering: the play button draws its outline, fills with red and gets its triangle
 * as the load progresses; below it a player bar with a scrubber, the percentage and what is loading. Progress follows real
 * milestones (`target`), eased and written straight to the DOM every frame, so React does not re-render.
 */
export function YtLoader({ target, done }: { target: number; done: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const shown = useRef(0);
  const goal = useRef({ target, done });
  goal.current = { target, done };

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const q = <T extends Element>(sel: string) => root.querySelector<T>(sel)!;
    const outline = q<SVGPathElement>("[data-l-outline]");
    const fill = q<SVGPathElement>("[data-l-fill]");
    const tri = q<SVGPathElement>("[data-l-tri]");
    const bar = q<HTMLElement>("[data-l-bar]");
    const knob = q<HTMLElement>("[data-l-knob]");
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

      // Outline over the first 45 %, red fill from 35 % to 75 %, the triangle grows in over the last stretch.
      outline.style.strokeDashoffset = String(1 - clamp01(p / 0.45));
      fill.style.opacity = String(clamp01((p - 0.35) / 0.4));
      const tp = clamp01((p - 0.62) / 0.33);
      tri.style.transform = `scale(${0.4 + 0.6 * (1 - Math.pow(1 - tp, 3))})`;
      tri.style.opacity = String(tp);
      bar.style.transform = `scaleX(${p})`;
      knob.style.left = `${p * 100}%`;
      pct.textContent = `${Math.round(p * 100)}%`;
      step.textContent = p >= 1 ? steps[3] : steps[Math.min(2, Math.floor(p * 3))];
      if (p < 1) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [done]);

  return (
    <div
      ref={rootRef}
      role="progressbar"
      aria-label="Loading"
      aria-valuemin={0}
      aria-valuemax={100}
      className={`yt-loader loader fixed inset-0 z-50 flex flex-col items-center justify-center bg-background ${done ? "is-done" : ""}`}
    >
      <div className="yt-backdrop absolute inset-0" aria-hidden="true" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset("/yt/air-logo.svg")} alt="AIR" width={157} height={31} className="absolute left-1/2 top-10 h-5 w-auto -translate-x-1/2 opacity-80" />

      <div className="yt-loader-stage relative flex flex-col items-center">
        <span className="yt-loader-halo" aria-hidden="true" />
        <svg viewBox="-1 -1 30.57 22" className="relative h-auto w-36 overflow-visible sm:w-44" aria-hidden="true">
          <path data-l-fill d={BODY} fill="#FF0033" style={{ opacity: 0 }} />
          <path data-l-outline d={BODY} fill="none" stroke="#FF0033" strokeWidth="0.45" pathLength={1} strokeDasharray="1" style={{ strokeDashoffset: 1 }} />
          <path data-l-tri d="M11.4 14.29 18.83 10 11.4 5.71z" fill="#FFFFFF" style={{ opacity: 0, transformOrigin: "14.6px 10px" }} />
        </svg>
        <p className="mt-8 text-xs font-medium uppercase tracking-[0.32em] text-muted">{ytCopy.loader.label}</p>

        <div className="mt-8 w-[min(18rem,70vw)]">
          <div className="relative h-1 rounded-full bg-white/10">
            <span data-l-bar className="absolute inset-0 origin-left rounded-full bg-[#FF0033]" style={{ transform: "scaleX(0)" }} />
            <span data-l-knob className="yt-loader-knob absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF0033]" style={{ left: 0 }} />
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted">
            <span data-l-step>{ytCopy.loader.steps[0]}</span>
            <span data-l-pct className="tabular-nums text-foreground">0%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
