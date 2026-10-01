"use client";

import { useThree } from "@react-three/fiber";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect } from "react";
import { Color } from "three";
import { MOVE_SHARE, frames, validateFrames, type FrameState } from "@/lib/frames";
import { applyFrame, sceneState } from "@/lib/sceneState";
import { theme } from "@/lib/theme";

gsap.registerPlugin(ScrollTrigger);

const ORBIT_FROM = 0.97;

const bgLight = new Color(theme.background);
const bgDeep = new Color(theme.backgroundDeep);
const bg = new Color();

let steps: HTMLElement[] = [];
const root = typeof document === "undefined" ? null : document.documentElement;

/** Mirrors scene numbers into the page: body colour, the vignette tone and the "How it works" step bars. Writes only CSS custom properties. */
function syncBackground() {
  bg.copy(bgLight).lerp(bgDeep, sceneState.bgTone);
  document.body.style.backgroundColor = `#${bg.getHexString()}`;
  root?.style.setProperty("--tone", sceneState.bgTone.toFixed(3));
  const lit = [sceneState.hCap, sceneState.hLabel, sceneState.hBox];
  steps.forEach((el, i) => el.style.setProperty("--lit", lit[i].toFixed(3)));
}

/** Text reveal: words arrive after the camera has mostly settled, never together with it. */
function revealText(reduced: boolean) {
  gsap.utils.toArray<HTMLElement>("[data-frame]").forEach((section, i) => {
    const items = section.querySelectorAll("[data-reveal]");
    const words = section.querySelectorAll("[data-word]");
    // The hero is already server-rendered and visible; animating it in would make the LCP text flash.
    if (i === 0 || (!items.length && !words.length)) return;
    if (reduced) return;
    // Heading words rise out of their line masks first, then the supporting lines follow.
    const tl = gsap.timeline({ scrollTrigger: { trigger: section, start: "top 35%", toggleActions: "play none none reverse" } });
    if (words.length) tl.from(words, { yPercent: 110, rotate: 4, duration: 0.8, ease: "power4.out", stagger: 0.05 });
    if (items.length) tl.from(items, { opacity: 0, y: 24, duration: 0.9, ease: "power3.out", stagger: 0.1 }, words.length ? "-=0.55" : 0);
  });
}

function buildScrubTimeline(list: FrameState[], invalidate: () => void, onOrbit: (on: boolean) => void) {
  applyFrame(list[0]);
  const tl = gsap.timeline({
    defaults: { ease: "power2.inOut" },
    scrollTrigger: {
      trigger: "#content",
      start: "top top",
      end: "bottom bottom",
      scrub: 0.9,
    },
    onUpdate: () => {
      syncBackground();
      invalidate();
      // Uses the scrubbed timeline progress, not the raw scroll position: finger rotation starts only once the camera has actually settled on the last frame.
      onOrbit(tl.progress() > ORBIT_FROM);
    },
  });
  for (let i = 1; i < list.length; i++) {
    const { boxLid, hCap, hLabel, hBox, ...rest } = list[i];
    const isSteps = i === 2;
    tl.to(sceneState, { ...rest, ...(isSteps ? {} : { hCap, hLabel, hBox }), duration: MOVE_SHARE });
    // The box lid swings a little past open and springs back, like a hinged board lid.
    tl.to(sceneState, { boxLid, duration: MOVE_SHARE * 0.6, ease: "back.out(2.2)" }, `<${MOVE_SHARE * 0.3}`);
    if (isSteps) {
      // "How it works": consult -> review -> delivery light the cap, the label, then the box, one after another.
      const step = (1 - MOVE_SHARE + 0.3) / 3;
      tl.to(sceneState, { hCap: 1, duration: step, ease: "power1.inOut" }, `-=${0.3}`)
        .to(sceneState, { hCap: 0, hLabel: 1, duration: step, ease: "power1.inOut" })
        .to(sceneState, { hLabel: 0, hBox: 1, duration: step, ease: "power1.inOut" });
    } else {
      tl.to({}, { duration: 1 - MOVE_SHARE });
    }
  }
  return tl;
}

/** Reduced motion: no camera travel. Each frame cuts to its final state behind a short fade of the canvas. */
function buildReducedMotion(list: FrameState[], invalidate: () => void, onOrbit: (on: boolean) => void) {
  const layer = document.getElementById("scene-layer");
  const cut = (state: FrameState) => {
    gsap.to(layer, {
      opacity: 0,
      duration: 0.15,
      onComplete: () => {
        applyFrame({ ...state, idle: 0 });
        syncBackground();
        invalidate();
        gsap.to(layer, { opacity: 1, duration: 0.25 });
      },
    });
  };
  applyFrame({ ...list[0], idle: 0 });
  gsap.utils.toArray<HTMLElement>("[data-frame]").forEach((section, i) => {
    ScrollTrigger.create({
      trigger: section,
      start: "top center",
      end: "bottom center",
      onEnter: () => {
        cut(list[i]);
        onOrbit(i === list.length - 1);
      },
      onEnterBack: () => {
        cut(list[i]);
        onOrbit(i === list.length - 1);
      },
    });
  });
}

export function ScrollTimeline({ onOrbit }: { onOrbit: (on: boolean) => void }) {
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") validateFrames();
    const mm = gsap.matchMedia();
    mm.add(
      {
        mobile: "(max-width: 767px)",
        desktop: "(min-width: 768px)",
        reduced: "(prefers-reduced-motion: reduce)",
      },
      (ctx) => {
        const { mobile, reduced } = ctx.conditions as { mobile: boolean; reduced: boolean };
        const list = frames[mobile ? "mobile" : "desktop"];
        if (reduced) buildReducedMotion(list, invalidate, onOrbit);
        else buildScrubTimeline(list, invalidate, onOrbit);
        steps = gsap.utils.toArray<HTMLElement>("[data-step]");
        revealText(reduced);
        syncBackground();
        invalidate();
      },
    );
    return () => mm.revert();
  }, [invalidate, onOrbit]);

  return null;
}
