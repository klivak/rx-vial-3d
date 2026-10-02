"use client";

import { useThree } from "@react-three/fiber";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect } from "react";
import { ytFrames, type YtFrame } from "@/lib/yt/frames";
import { applyYtFrame, ytState } from "@/lib/yt/state";

gsap.registerPlugin(ScrollTrigger);

const root = typeof document === "undefined" ? null : document.documentElement;

/** Mirrors the button state into CSS: the glow behind the canvas follows the button and fades with its health. */
function syncCss() {
  const s = ytState;
  root?.style.setProperty("--yt-x", `${(50 + s.x * 50).toFixed(2)}%`);
  root?.style.setProperty("--yt-y", `${(50 - s.y * 50).toFixed(2)}%`);
  root?.style.setProperty("--yt-glow", s.glow.toFixed(3));
  root?.style.setProperty("--yt-health", s.health.toFixed(3));
}

/**
 * One scrubbed tween per screen: the move into frame i runs while section i rises from the bottom of the viewport to 30% from the
 * top, so screens of any height work and the rest of the section is a still plateau for reading.
 */
function buildScrub(list: YtFrame[], invalidate: () => void) {
  applyYtFrame(list[0]);
  const onUpdate = () => {
    syncCss();
    invalidate();
  };
  gsap.utils.toArray<HTMLElement>("[data-yt-frame]").forEach((section, i) => {
    if (i === 0 || !list[i]) return;
    const { health: fromHealth, glow: fromGlow, ...fromMove } = list[i - 1];
    const { health, glow, ...move } = list[i];
    // Lenis already smooths the wheel, so a short scrub is enough to take the edge off touch flings.
    const tl = gsap.timeline({ scrollTrigger: { trigger: section, start: "top bottom", end: "top 30%", scrub: 0.6 }, onUpdate });
    tl.fromTo(ytState, fromMove, { ...move, duration: 1, ease: "power2.inOut", immediateRender: false });
    // Colour drains a little behind the motion, so the button turns first and then "goes grey".
    tl.fromTo(ytState, { health: fromHealth, glow: fromGlow }, { health, glow, duration: 0.7, ease: "power1.inOut", immediateRender: false }, 0.3);
  });
}

/** Reduced motion: the button does not travel; each screen cuts to its final pose behind a short canvas fade. */
function buildReduced(list: YtFrame[], invalidate: () => void) {
  const layer = document.getElementById("scene-layer");
  const cut = (frame: YtFrame) =>
    gsap.to(layer, {
      opacity: 0,
      duration: 0.15,
      onComplete: () => {
        applyYtFrame({ ...frame, idle: 0 });
        syncCss();
        invalidate();
        gsap.to(layer, { opacity: 1, duration: 0.25 });
      },
    });
  applyYtFrame({ ...list[0], idle: 0 });
  gsap.utils.toArray<HTMLElement>("[data-yt-frame]").forEach((section, i) => {
    if (!list[i]) return;
    ScrollTrigger.create({
      trigger: section,
      start: "top center",
      end: "bottom center",
      onEnter: () => cut(list[i]),
      onEnterBack: () => cut(list[i]),
    });
  });
}

export function YtScrollTimeline() {
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add(
      // matchMedia runs the callback when any condition matches, so desktop needs its own entry.
      { mobile: "(max-width: 767px)", desktop: "(min-width: 768px)", reduced: "(prefers-reduced-motion: reduce)" },
      (ctx) => {
        const { mobile, reduced } = ctx.conditions as { mobile: boolean; reduced: boolean };
        const list = ytFrames[mobile ? "mobile" : "desktop"];
        if (reduced) buildReduced(list, invalidate);
        else buildScrub(list, invalidate);
        syncCss();
        invalidate();
      },
    );
    return () => mm.revert();
  }, [invalidate]);

  return null;
}
