"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect } from "react";
import { fireBeat } from "@/lib/yt/state";

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
    if (items.length) tl.from(items, { opacity: 0, y: 26, duration: 0.9, ease: "power3.out", stagger: 0.08 }, words.length ? "-=0.6" : 0);
  });
}

/** Hero: the chips around the button and the press hint drift up and dissolve as the hero scrolls away. */
function heroFade() {
  const layer = document.querySelector("[data-hero-fade]");
  if (!layer) return;
  const tl = gsap.timeline({ scrollTrigger: { trigger: layer, start: "top top", end: "+=40%", scrub: 0.5 } });
  // Opacity and transform only: a scrubbed blur re-filtered the chip cards on every scroll frame, which phones could not keep up with.
  tl.to(layer, { opacity: 0, y: -60, ease: "none" }, 0);
}

/** `[data-draw]` paths draw themselves with the scroll; `[data-light]` items light up in turn while their group crosses the screen. */
function scrubbedLines(desktop: boolean) {
  q<SVGPathElement>("[data-draw]").forEach((path) => {
    const length = path.getTotalLength();
    const svg = path.ownerSVGElement;
    const tl = gsap.timeline({
      scrollTrigger: { trigger: path.closest("[data-yt-frame]") ?? path, start: "top 60%", end: "center 40%", scrub: 0.8 },
    });
    tl.fromTo(path, { strokeDasharray: length, strokeDashoffset: length }, { strokeDashoffset: 0, ease: "none", duration: 1 }, 0);
    // The area under the line fills in behind the pen; the peak marker pops when the pen passes it, "now" at the very end.
    const area = svg?.querySelector("[data-area]");
    if (area) tl.fromTo(area, { opacity: 0 }, { opacity: 1, ease: "none", duration: 0.8 }, 0.2);
    svg?.querySelectorAll("[data-marker]").forEach((marker, i) =>
      tl.fromTo(marker, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.12, ease: "power2.out" }, i === 0 ? 0.55 : 0.92),
    );
  });
  q("[data-light-group]").forEach((group) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: group, start: "top 70%", end: "bottom 45%", scrub: 0.6 } });
    q("[data-light]", group).forEach((el, i) => tl.fromTo(el, { "--lit": 0 }, { "--lit": 1, duration: 1, ease: "power1.inOut" }, i * 0.6));
    const grow = group.querySelector("[data-grow]");
    if (grow) tl.fromTo(grow, desktop ? { scaleX: 0 } : { scaleY: 0 }, { scaleX: 1, scaleY: 1, duration: tl.duration(), ease: "none" }, 0);
  });
}

/** Screen 2: each pain that lights up hits the grey button (it jolts, its cracks flare, chips fall off), so the problems land on the channel one by one. */
function painBeats() {
  q("#problem [data-light]").forEach((pain) =>
    ScrollTrigger.create({ trigger: pain, start: "top 64%", onEnter: fireBeat, onEnterBack: fireBeat }),
  );
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
      ? { trigger: section, start: "top 30%", end: "bottom bottom", scrub: 0.5 }
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

/**
 * Screen 6: the benchmark plays once, in reading order. The legend arrives, then each chart in turn: its label, its rows sliding in,
 * bars growing and numbers counting up from zero, with the next chart starting as the previous one settles. The insight lands last.
 */
function bench() {
  const section = document.querySelector<HTMLElement>("[data-bench]");
  if (!section) return () => {};
  const card = section.querySelector(".yt-glass") ?? section;
  const values = q("[data-bench-value]", section);
  const finals = values.map((el) => el.textContent ?? "");
  // The card itself fades in with the section reveal; the charts wait a beat so they play on a card that is already there.
  const tl = gsap.timeline({ delay: 0.25, scrollTrigger: { trigger: card, start: "top 70%", toggleActions: "play none none reverse" } });
  tl.from(q("[data-bench-legend]", section), { opacity: 0, y: 8, duration: 0.5, ease: "power2.out", stagger: 0.07 }, 0);
  q("[data-bench-metric]", section).forEach((metric, k) => {
    const at = 0.35 + k * 0.7;
    tl.from(metric.querySelector("[data-bench-label]"), { opacity: 0, x: -12, duration: 0.5, ease: "power2.out" }, at);
    tl.from(q("[data-bench-row]", metric), { opacity: 0, x: 14, duration: 0.55, ease: "power3.out", stagger: 0.08 }, at + 0.08);
    tl.from(q("[data-bench-bar]", metric), { scaleX: 0, duration: 1.2, ease: "expo.out", stagger: 0.08 }, at + 0.18);
    q("[data-bench-value]", metric).forEach((el, i) => {
      const value = Number(el.dataset.benchValue);
      const decimals = Number(el.dataset.decimals);
      const suffix = finals[values.indexOf(el)].slice(String(value).length);
      const n = { v: 0 };
      tl.fromTo(
        n,
        { v: 0 },
        { v: value, duration: 1.2, ease: "expo.out", onUpdate: () => (el.textContent = n.v.toFixed(decimals) + suffix) },
        at + 0.18 + i * 0.08,
      );
    });
  });
  tl.from(section.querySelector("[data-bench-insight]"), { opacity: 0, y: 16, duration: 0.8, ease: "power3.out" }, "-=0.7");
  return () => values.forEach((el, i) => (el.textContent = finals[i]));
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
  // Only restack when a card actually changes depth band: a z-index write every frame restacked nine frosted cards per tick.
  const z: string[] = [];
  const place = () => {
    const rx = Math.min(innerWidth * 0.38, 600);
    const ry = Math.min(innerHeight * 0.2, 200);
    items.forEach((el, i) => {
      const a = (i / items.length) * Math.PI * 2 + state.turn + state.drift - Math.PI / 2;
      const depth = (Math.sin(a) + 1) / 2;
      el.style.transform = `translate(-50%, -50%) translate(${(Math.cos(a) * rx).toFixed(1)}px, ${(Math.sin(a) * ry).toFixed(1)}px) scale(${(0.78 + 0.22 * depth).toFixed(3)})`;
      // Cards at the back fade well down so they read as behind the button, not on top of the heading.
      el.style.opacity = (0.2 + 0.8 * depth * depth).toFixed(3);
      const zi = String(Math.round(depth * 10));
      if (z[i] !== zi) el.style.zIndex = z[i] = zi;
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

/** Buttons lean towards the mouse (a few pixels, via the separate `translate` property so hover transforms are untouched). */
function magnetic() {
  const els = q("[data-magnetic]");
  const move = (e: PointerEvent) => {
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--tx", `${((e.clientX - r.left) / r.width - 0.5) * 10}px`);
    el.style.setProperty("--ty", `${((e.clientY - r.top) / r.height - 0.5) * 8}px`);
  };
  const leave = (e: PointerEvent) => {
    const el = e.currentTarget as HTMLElement;
    el.style.setProperty("--tx", "0px");
    el.style.setProperty("--ty", "0px");
  };
  els.forEach((el) => {
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
  });
  return () =>
    els.forEach((el) => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    });
}

/** A ring of light spreads from the exact point a button is pressed. Works for mouse and touch. */
function ripples() {
  const press = (e: PointerEvent) => {
    const el = (e.target as Element | null)?.closest<HTMLElement>(".yt-btn-primary, .yt-btn-ghost");
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dot = document.createElement("span");
    dot.className = "yt-ripple";
    dot.style.left = `${e.clientX - r.left}px`;
    dot.style.top = `${e.clientY - r.top}px`;
    dot.style.setProperty("--d", `${Math.hypot(r.width, r.height) * 2}px`);
    el.appendChild(dot);
    dot.addEventListener("animationend", () => dot.remove());
  };
  document.addEventListener("pointerdown", press);
  return () => document.removeEventListener("pointerdown", press);
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
      if (motion) cleanups.push(ripples());
      if (desktop && motion) cleanups.push(magnetic());
      if (motion) {
        reveals();
        heroFade();
        painBeats();
        scrubbedLines(desktop);
        scan(desktop);
        report();
        thumbs();
        cleanups.push(bench());
      }
      return () => cleanups.forEach((fn) => fn());
    });
    return () => mm.revert();
  }, []);

  return null;
}
