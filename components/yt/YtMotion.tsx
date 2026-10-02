"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect } from "react";

gsap.registerPlugin(ScrollTrigger);

const q = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => gsap.utils.toArray<T>(root.querySelectorAll(sel));

/** Headings: words rise out of their line masks, then the section's `[data-reveal]` lines follow. The hero keeps its CSS intro. */
function reveals() {
  q("[data-yt-frame]").forEach((section, i) => {
    if (i === 0) return;
    const words = section.querySelectorAll("[data-word]");
    const items = section.querySelectorAll("[data-reveal]");
    const tl = gsap.timeline({ scrollTrigger: { trigger: section, start: "top 55%", toggleActions: "play none none reverse" } });
    if (words.length) tl.from(words, { yPercent: 115, rotate: 3, duration: 0.9, ease: "power4.out", stagger: 0.045 });
    if (items.length) tl.from(items, { opacity: 0, y: 26, filter: "blur(6px)", duration: 0.9, ease: "power3.out", stagger: 0.08 }, words.length ? "-=0.6" : 0);
  });
}

/** `[data-draw]` paths draw themselves with the scroll; `[data-light]` items light up in turn while their group crosses the screen. */
function scrubbedLines(desktop: boolean) {
  q<SVGPathElement>("[data-draw]").forEach((path) => {
    const length = path.getTotalLength();
    gsap.fromTo(
      path,
      { strokeDasharray: length, strokeDashoffset: length },
      { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: path.closest("[data-yt-frame]") ?? path, start: "top 60%", end: "center 40%", scrub: 0.8 } },
    );
  });
  q("[data-light-group]").forEach((group) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: group, start: "top 70%", end: "bottom 45%", scrub: 0.6 } });
    q("[data-light]", group).forEach((el, i) => tl.fromTo(el, { "--lit": 0 }, { "--lit": 1, duration: 1, ease: "power1.inOut" }, i * 0.6));
    const grow = group.querySelector("[data-grow]");
    if (grow) tl.fromTo(grow, desktop ? { scaleX: 0 } : { scaleY: 0 }, { scaleX: 1, scaleY: 1, duration: tl.duration(), ease: "none" }, 0);
  });
}

/** Screen 3: the groups light up one by one, their checks tick in order, and the counter runs to 35+ across the sticky stage. */
function scan(desktop: boolean) {
  const section = document.querySelector<HTMLElement>("[data-scan]");
  if (!section) return;
  const counter = section.querySelector<HTMLElement>("[data-scan-count]");
  const groups = q("[data-scan-group]", section);
  const total = 35;
  const count = { n: 0 };
  const tl = gsap.timeline({
    scrollTrigger: desktop
      ? { trigger: section, start: "top top", end: "bottom bottom", scrub: 0.5 }
      : { trigger: section, start: "top 40%", end: "bottom 80%", scrub: 0.5 },
  });
  groups.forEach((group) => {
    tl.fromTo(group, { "--lit": 0 }, { "--lit": 1, duration: 0.4, ease: "power2.out" });
    q("[data-scan-item]", group).forEach((item) => tl.fromTo(item, { "--on": 0 }, { "--on": 1, duration: 0.18, ease: "power1.out" }, "-=0.06"));
  });
  tl.fromTo(
    count,
    { n: 0 },
    {
      n: total,
      duration: tl.duration(),
      ease: "none",
      onUpdate: () => {
        if (counter) counter.textContent = count.n >= total - 0.5 ? `${total}+` : String(Math.round(count.n));
      },
    },
    0,
  );
  tl.to({}, { duration: 0.6 });
}

/** Screen 4: the sample report assembles itself once: ring and numbers count up, bars grow, verdicts and plan arrive in order. */
function report() {
  const section = document.querySelector<HTMLElement>("[data-report]");
  if (!section) return;
  const tl = gsap.timeline({ scrollTrigger: { trigger: section.querySelector("article") ?? section, start: "top 70%", toggleActions: "play none none reverse" } });
  const ring = section.querySelector<SVGCircleElement>("[data-ring]");
  if (ring) {
    const full = Number(ring.getAttribute("stroke-dasharray"));
    tl.from(ring, { strokeDashoffset: full, duration: 1.6, ease: "power3.out" }, 0.2);
  }
  q("[data-count]", section).forEach((el) => {
    const value = Number(el.dataset.count);
    const n = { v: 0 };
    tl.fromTo(n, { v: 0 }, { v: value, duration: 1.6, ease: "power3.out", onUpdate: () => (el.textContent = String(Math.round(n.v))) }, 0.2);
  });
  tl.from(q("[data-bar]", section), { scaleX: 0, duration: 1.2, ease: "power3.out", stagger: 0.12 }, 0.35);
  tl.from(q("[data-row]", section), { opacity: 0, x: 18, duration: 0.7, ease: "power3.out", stagger: 0.07 }, 0.5);
}

/** Screen 5: twelve thumbnails start scattered over the screen and the scroll sorts them into "best" and "weakest". */
function thumbs() {
  const section = document.querySelector<HTMLElement>("[data-thumbs]");
  if (!section) return;
  const cards = q("[data-thumb]", section);
  // Deterministic scatter in viewport units: every card starts somewhere else, tilted, and the scroll sorts it into place.
  gsap.fromTo(
    cards,
    {
      x: (i: number) => Math.sin(i * 2.4 + 1) * innerWidth * 0.34,
      y: (i: number) => Math.cos(i * 1.7) * innerHeight * 0.26,
      rotate: (i: number) => Math.sin(i * 3.1) * 14,
      scale: 0.82,
      opacity: 0,
    },
    {
      x: 0,
      y: 0,
      rotate: 0,
      scale: 1,
      opacity: 1,
      ease: "power2.out",
      stagger: 0.04,
      scrollTrigger: { trigger: section, start: "top 85%", end: "center 60%", scrub: 0.8, invalidateOnRefresh: true },
    },
  );
}

/** Screen 8 (desktop): cards ride a tilted ellipse around the button; scroll turns it, a slow drift keeps it alive at rest. */
function orbit(drift: boolean) {
  const section = document.querySelector<HTMLElement>("[data-orbit]");
  if (!section) return () => {};
  const items = q("[data-orbit-item]", section);
  const state = { turn: 0, drift: 0, active: false };
  const place = () => {
    const rx = Math.min(innerWidth * 0.38, 600);
    const ry = Math.min(innerHeight * 0.2, 200);
    items.forEach((el, i) => {
      const a = (i / items.length) * Math.PI * 2 + state.turn + state.drift - Math.PI / 2;
      const depth = (Math.sin(a) + 1) / 2;
      el.style.transform = `translate(-50%, -50%) translate(${(Math.cos(a) * rx).toFixed(1)}px, ${(Math.sin(a) * ry).toFixed(1)}px) scale(${(0.78 + 0.22 * depth).toFixed(3)})`;
      // Cards at the back fade well down so they read as behind the button, not on top of the heading.
      el.style.opacity = (0.2 + 0.8 * depth * depth).toFixed(3);
      el.style.zIndex = String(Math.round(depth * 10));
    });
  };
  gsap.to(state, {
    turn: Math.PI * 1.25,
    ease: "none",
    scrollTrigger: { trigger: section, start: "top bottom", end: "bottom bottom", scrub: 0.8, onToggle: (st) => (state.active = st.isActive) },
    onUpdate: place,
  });
  const tick = (_: number, dt: number) => {
    if (!state.active || !drift) return;
    state.drift += dt * 0.00005;
    place();
  };
  gsap.ticker.add(tick);
  place();
  return () => {
    gsap.ticker.remove(tick);
    items.forEach((el) => el.removeAttribute("style"));
  };
}

/** Plan cards: spotlight and a small tilt that follow the pointer, written as CSS variables. */
function spotlights() {
  const cards = q("[data-spot]");
  const move = (e: PointerEvent) => {
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
    el.style.setProperty("--rx", `${(0.5 - y) * 5}deg`);
    el.style.setProperty("--ry", `${(x - 0.5) * 5}deg`);
  };
  const leave = (e: PointerEvent) => {
    const el = e.currentTarget as HTMLElement;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };
  cards.forEach((el) => {
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
  });
  return () =>
    cards.forEach((el) => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    });
}

/**
 * Scroll motion of the HTML layer, independent of WebGL so it also runs on the poster fallback. Reduced motion leaves everything
 * in its final state (lit, ticked, sorted, counted).
 */
export function YtMotion() {
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add({ desktop: "(min-width: 768px)", motion: "(prefers-reduced-motion: no-preference)" }, (ctx) => {
      const { desktop, motion } = ctx.conditions as { desktop: boolean; motion: boolean };
      const cleanups: Array<() => void> = [];
      if (desktop) cleanups.push(spotlights(), orbit(motion));
      if (motion) {
        reveals();
        scrubbedLines(desktop);
        scan(desktop);
        report();
        thumbs();
      }
      return () => cleanups.forEach((fn) => fn());
    });
    return () => mm.revert();
  }, []);

  return null;
}
