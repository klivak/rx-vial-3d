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
let scene: HTMLElement | null = null;
let layerH = 0;
let awards: HTMLElement[] | null = null;
let subs: HTMLElement | null = null;
/** Last value written per property, so a scroll frame that changes nothing writes nothing (each write restyles the element). */
const written = new Map<string, string>();
let lastTier = NaN;
/** Button state at the last 3D redraw, so a scroll frame that leaves the scene unchanged (or invisible) does not re-render it. */
let lastPose = "";

function poseChanged() {
  const s = ytState;
  const pose = s.show < 0.001 ? "hidden" : Object.values(s).map((v) => (v as number).toFixed(4)).join();
  if (pose === lastPose) return false;
  lastPose = pose;
  return true;
}

function put(el: HTMLElement, key: string, name: string, value: string) {
  if (written.get(key) === value) return;
  written.set(key, value);
  el.style.setProperty(name, value);
}

function measureLayer() {
  layerH = layer?.clientHeight || window.innerHeight;
}

/**
 * Mirrors the button state into CSS and the page: the glow follows the button and fades with its fill, `--yt-tier` lights the
 * milestone cards, and the subscriber counter follows the metal (10K at red, 100K silver, 1M gold, 10M diamond).
 */
function syncCss() {
  const s = ytState;
  // Written on the elements that use them, not on <html>: a root variable change restyles the whole page on every scroll frame.
  if (!layer) {
    layer = document.getElementById("scene-layer");
    measureLayer();
  }
  scene ??= document.querySelector<HTMLElement>(".yt-3d");
  if (scene) put(scene, "show", "opacity", s.show.toFixed(3));
  awards ??= Array.from(document.querySelectorAll<HTMLElement>("[data-award]"));
  if (layer) {
    // The glow moves in pixels with `translate`, so following the button is a compositor move, not a full-screen repaint.
    const w = window.innerWidth;
    put(layer, "gx", "--yt-gx", `${((0.5 + s.x * 0.5 * columnShare(w)) * w).toFixed(1)}px`);
    put(layer, "gy", "--yt-gy", `${((0.5 - s.y * 0.5) * layerH).toFixed(1)}px`);
    put(layer, "glow", "--yt-glow", (s.glow * s.show).toFixed(3));
    put(layer, "health", "--yt-health", s.fill.toFixed(3));
    put(layer, "tier", "--yt-tier", (Math.min(1, s.tier) * (1 - s.lacquer)).toFixed(3));
    put(layer, "glowc", "--yt-glow-c", glowColor(s.tier, s.lacquer));
  }
  // Award row i lights up as the metal passes from tier i to i + 1.
  if (s.tier !== lastTier) {
    awards.forEach((el, i) => put(el, `award${i}`, "--lit", Math.min(1, Math.max(0, s.tier - i)).toFixed(3)));
    subs ??= document.querySelector("[data-subs]");
    if (subs) {
      const text = Math.round(Math.pow(10, 4 + s.tier)).toLocaleString("en-US");
      if (subs.textContent !== text) subs.textContent = text;
    }
    lastTier = s.tier;
  }
}

/** Glow behind the button per finish (red, silver, gold, diamond), blended between neighbours. */
const GLOWS = [
  [255, 0, 51],
  [215, 228, 255],
  [255, 172, 20],
  [100, 170, 255],
];
function glowColor(tier: number, lacquer: number) {
  const t = Math.min(3, Math.max(0, tier));
  const i = Math.min(2, Math.floor(t));
  const k = t - i;
  return GLOWS[i].map((c, j) => {
    const metal = c + (GLOWS[i + 1][j] - c) * k;
    return Math.round(metal + (GLOWS[0][j] - metal) * lacquer);
  }).join(" ");
}

/** Frame i with its in-section track applied: where the button is when the visitor leaves screen i. */
const settled = (list: YtFrame[], i: number): YtFrame => ({ ...list[i], ...ytTracks[i] });

/**
 * A sticky screen can mark the free space for the button (`data-yt-anchor`, down to `data-yt-anchor-end`): its layout is in pixels
 * (padding, heading, counter), so a fixed share of the viewport lands on the text on some heights. The frame is centred in that
 * space and shrunk to fit it.
 */
function anchored(frame: YtFrame, section: HTMLElement, vh: number): YtFrame {
  const anchor = section.querySelector<HTMLElement>("[data-yt-anchor]");
  const stage = anchor?.closest<HTMLElement>("[data-yt-stage]");
  if (!anchor || !stage || getComputedStyle(stage).position !== "sticky") return frame;
  const base = stage.getBoundingClientRect().top;
  const top = anchor.getBoundingClientRect().top - base;
  const bottom = (anchor.querySelector("[data-yt-anchor-end]") ?? anchor).getBoundingClientRect().top - base;
  if (bottom - top < 40) return frame;
  return { ...frame, y: 1 - (top + bottom) / vh, scale: Math.min(frame.scale, (0.62 * (bottom - top)) / vh) };
}

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
        if (poseChanged()) invalidate();
      },
    });
    // The timeline spans exactly 0..1 of the scroll range.
    tl.to({}, { duration: 1 }, 0);
    const sections = gsap.utils.toArray<HTMLElement>("[data-yt-frame]");
    const tops = sections.map((el) => el.getBoundingClientRect().top + window.scrollY);
    const poses = list.map((frame, i) => (sections[i] ? anchored(frame, sections[i], vh) : frame));
    sections.forEach((section, i) => {
      if (!poses[i]) return;
      const top = tops[i];
      // A move never runs into the next one: when the next section starts its move, this one must already have landed, or the next
      // tween's from-values (this frame's settled pose) snap the button out of a half-finished move (the CTA is shorter than its span).
      const nextStart = i + 1 < tops.length ? tops[i + 1] - vh : Infinity;
      const arrive = at(Math.min(top - vh + vh * (ytSpans[i] ?? 0.7), nextStart));
      if (i > 0) {
        const start = at(top - vh);
        const span = Math.max(0.0005, arrive - start);
        const { fill: fromFill, glow: fromGlow, tier: fromTier, lacquer: fromLacquer, show: fromShow, ...fromMove } = settled(poses, i - 1);
        const { fill, glow, tier, lacquer, show, ...move } = poses[i];
        tl!.fromTo(ytState, fromMove, { ...move, duration: span, ease: "power2.inOut", immediateRender: false }, start);
        // Fading in, the button stays faint until it has nearly landed (it drops in over the previous screen's text); fading out,
        // it goes early.
        if (show !== fromShow) {
          const ease = show > fromShow ? "power3.in" : "power2.out";
          tl!.fromTo(ytState, { show: fromShow }, { show, duration: span, ease, immediateRender: false }, start);
        }
        // Colour and finish follow a little behind the motion: the button turns first, then drains, fills or changes metal.
        tl!.fromTo(
          ytState,
          { fill: fromFill, glow: fromGlow, tier: fromTier, lacquer: fromLacquer },
          { fill, glow, tier, lacquer, duration: span * 0.7, ease: "sine.inOut", immediateRender: false },
          start + span * 0.3,
        );
      }
      const track = ytTracks[i];
      if (track) {
        const end = Math.max(arrive + 0.0005, at(top + section.offsetHeight - vh));
        const from = Object.fromEntries(Object.keys(track).map((k) => [k, poses[i][k as keyof YtFrame]]));
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
    // The glow's y is in layer pixels; re-measure when the layer resizes, at most once a frame, and stop when the page unmounts.
    const target = document.getElementById("scene-layer");
    let frame = 0;
    const observer = new ResizeObserver(() => {
      if (!frame) frame = requestAnimationFrame(() => ((frame = 0), measureLayer()));
    });
    if (target) observer.observe(target);
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
    return () => {
      mm.revert();
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [invalidate]);

  return null;
}
