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

const bgLight = new Color(theme.background);
const bgDeep = new Color(theme.backgroundDeep);
const bg = new Color();

function syncBackground() {
  bg.copy(bgLight).lerp(bgDeep, sceneState.bgTone);
  document.body.style.backgroundColor = `#${bg.getHexString()}`;
}

/** Text reveal: words arrive after the camera has mostly settled, never together with it. */
function revealText(reduced: boolean) {
  gsap.utils.toArray<HTMLElement>("[data-frame]").forEach((section, i) => {
    const items = section.querySelectorAll("[data-reveal]");
    // The hero is already server-rendered and visible; animating it in would make the LCP text flash.
    if (i === 0 || !items.length) return;
    if (reduced) {
      gsap.set(items, { opacity: 1, y: 0 });
      return;
    }
    gsap.from(items, {
      opacity: 0,
      y: 24,
      duration: 0.9,
      ease: "power3.out",
      stagger: 0.12,
      scrollTrigger: { trigger: section, start: "top 35%", toggleActions: "play none none reverse" },
    });
  });
}

function buildScrubTimeline(list: FrameState[], invalidate: () => void) {
  applyFrame(list[0]);
  const tl = gsap.timeline({
    defaults: { ease: "power2.inOut" },
    scrollTrigger: { trigger: "#content", start: "top top", end: "bottom bottom", scrub: 0.9 },
    onUpdate: () => {
      syncBackground();
      invalidate();
    },
  });
  for (let i = 1; i < list.length; i++) {
    const { boxLid, hCap, hLabel, hBox, ...rest } = list[i];
    const isSteps = i === 2;
    tl.to(sceneState, { ...rest, ...(isSteps ? {} : { hCap, hLabel, hBox }), duration: MOVE_SHARE });
    // The box lid snaps open fast and settles slowly, the only expo ease on the page.
    tl.to(sceneState, { boxLid, duration: MOVE_SHARE * 0.6, ease: "expo.out" }, `<${MOVE_SHARE * 0.3}`);
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
function buildReducedMotion(list: FrameState[], invalidate: () => void) {
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
      onEnter: () => cut(list[i]),
      onEnterBack: () => cut(list[i]),
    });
  });
}

export function ScrollTimeline() {
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
        if (reduced) buildReducedMotion(list, invalidate);
        else buildScrubTimeline(list, invalidate);
        revealText(reduced);
        syncBackground();
        invalidate();
      },
    );
    return () => mm.revert();
  }, [invalidate]);

  return null;
}
