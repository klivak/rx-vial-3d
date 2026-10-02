"use client";

import { useThree } from "@react-three/fiber";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect } from "react";
import { ytFrames, ytSpans, ytTracks, type YtFrame } from "@/lib/yt/frames";
import { columnShare } from "@/lib/yt/layout";
import { applyYtFrame, ytState } from "@/lib/yt/state";

gsap.registerPlugin(ScrollTrigger);

let layer: HTMLElement | null = null;
let awards: HTMLElement[] | null = null;
let subs: HTMLElement | null = null;
let lastSubs = "";

/**
 * Mirrors the button state into CSS and the page: the glow follows the button and fades with its fill, `--yt-tier` lights the
 * milestone cards, and the subscriber counter follows the metal (10K at red, 100K silver, 1M gold, 10M diamond).
 */
function syncCss() {
  const s = ytState;
  // Written on the elements that use them, not on <html>: a root variable change restyles the whole page on every scroll frame.
  layer ??= document.getElementById("scene-layer");
  awards ??= Array.from(document.querySelectorAll<HTMLElement>("[data-award]"));
  layer?.style.setProperty("--yt-x", `${(50 + s.x * 50 * columnShare(window.innerWidth)).toFixed(2)}%`);
  layer?.style.setProperty("--yt-y", `${(50 - s.y * 50).toFixed(2)}%`);
  layer?.style.setProperty("--yt-glow", s.glow.toFixed(3));
  layer?.style.setProperty("--yt-health", s.fill.toFixed(3));
  layer?.style.setProperty("--yt-tier", s.tier.toFixed(3));
  layer?.style.setProperty("--yt-glow-c", glowColor(s.tier));
  // Award row i lights up as the metal passes from tier i to i + 1.
  awards.forEach((el, i) => el.style.setProperty("--lit", Math.min(1, Math.max(0, s.tier - i)).toFixed(3)));
  subs ??= document.querySelector("[data-subs]");
  if (subs) {
    const text = Math.round(Math.pow(10, 4 + s.tier)).toLocaleString("en-US");
    if (text !== lastSubs) subs.textContent = lastSubs = text;
  }
}

/** Glow behind the button per finish (red, silver, gold, diamond), blended between neighbours. */
const GLOWS = [
  [255, 0, 51],
  [190, 205, 230],
  [255, 190, 80],
  [140, 195, 255],
];
function glowColor(tier: number) {
  const t = Math.min(3, Math.max(0, tier));
  const i = Math.min(2, Math.floor(t));
  const k = t - i;
  return GLOWS[i].map((c, j) => Math.round(c + (GLOWS[i + 1][j] - c) * k)).join(" ");
}

/** Frame i with its in-section track applied: where the button is when the visitor leaves screen i. */
const settled = (list: YtFrame[], i: number): YtFrame => ({ ...list[i], ...ytTracks[i] });

/**
 * One scrubbed timeline over the whole page, so a single playhead owns the button: separate scrubbed tweens per screen could
 * both be catching up after a fast scroll and write the same numbers in one frame, which made the button twitch.
 * The move into frame i runs while section i rises from the bottom of the viewport to 30% from the top; a section's track then
 * plays while the rest of it scrolls by. Positions come from the layout, so the timeline is rebuilt on every refresh.
 */
function buildScrub(list: YtFrame[], invalidate: () => void) {
  let tl: gsap.core.Timeline | null = null;
  const build = () => {
    const progress = tl?.progress() ?? 0;
    tl?.scrollTrigger?.kill();
    tl?.kill();
    const max = Math.max(1, ScrollTrigger.maxScroll(window));
    const vh = window.innerHeight;
    const at = (y: number) => Math.min(1, Math.max(0, y / max));
    tl = gsap.timeline({
      // Lenis already smooths the wheel, so a short scrub is enough to take the edge off touch flings.
      scrollTrigger: { start: 0, end: () => ScrollTrigger.maxScroll(window), scrub: 0.6 },
      onUpdate: () => {
        syncCss();
        invalidate();
      },
    });
    // The timeline spans exactly 0..1 of the scroll range.
    tl.to({}, { duration: 1 }, 0);
    gsap.utils.toArray<HTMLElement>("[data-yt-frame]").forEach((section, i) => {
      if (!list[i]) return;
      const top = section.getBoundingClientRect().top + window.scrollY;
      const arrive = at(top - vh + vh * (ytSpans[i] ?? 0.7));
      if (i > 0) {
        const start = at(top - vh);
        const span = Math.max(0.0005, arrive - start);
        const { fill: fromFill, glow: fromGlow, tier: fromTier, ...fromMove } = settled(list, i - 1);
        const { fill, glow, tier, ...move } = list[i];
        tl!.fromTo(ytState, fromMove, { ...move, duration: span, ease: "power2.inOut", immediateRender: false }, start);
        // Colour and finish follow a little behind the motion: the button turns first, then drains, fills or changes metal.
        tl!.fromTo(
          ytState,
          { fill: fromFill, glow: fromGlow, tier: fromTier },
          { fill, glow, tier, duration: span * 0.7, ease: "sine.inOut", immediateRender: false },
          start + span * 0.3,
        );
      }
      const track = ytTracks[i];
      if (track) {
        const end = Math.max(arrive + 0.0005, at(top + section.offsetHeight - vh));
        const from = Object.fromEntries(Object.keys(track).map((k) => [k, list[i][k as keyof YtFrame]]));
        tl!.fromTo(ytState, from, { ...track, duration: end - arrive, ease: "none", immediateRender: false }, arrive);
      }
    });
    tl.progress(progress);
  };
  applyYtFrame(list[0]);
  build();
  ScrollTrigger.addEventListener("refresh", build);
  return () => {
    ScrollTrigger.removeEventListener("refresh", build);
    tl?.scrollTrigger?.kill();
    tl?.kill();
  };
}

/** Reduced motion: the button does not travel; each screen cuts to its settled pose behind a short canvas fade. */
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
      onEnter: () => cut(settled(list, i)),
      onEnterBack: () => cut(settled(list, i)),
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
        const cleanup = reduced ? buildReduced(list, invalidate) : buildScrub(list, invalidate);
        syncCss();
        invalidate();
        return cleanup;
      },
    );
    return () => mm.revert();
  }, [invalidate]);

  return null;
}
