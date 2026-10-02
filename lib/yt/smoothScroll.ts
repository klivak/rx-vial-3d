import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;
let locked = true;

/**
 * Inertial wheel scrolling driven by the GSAP ticker, so Lenis, ScrollTrigger and the 3D timeline all step on the same frame.
 * Touch keeps native scrolling (Lenis leaves swipes alone by default), and reduced motion gets plain scroll with no Lenis at all.
 */
export function startSmoothScroll(): () => void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};

  lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4), anchors: { offset: 0 } });
  if (locked) lenis.stop();
  lenis.on("scroll", ScrollTrigger.update);
  const tick = (time: number) => lenis?.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  return () => {
    gsap.ticker.remove(tick);
    gsap.ticker.lagSmoothing(500, 33);
    lenis?.destroy();
    lenis = null;
  };
}

/** Called once the loader lifts: until then the page must not move under it. */
export function unlockScroll() {
  locked = false;
  lenis?.start();
}

/** Smooth jump for in-page links and buttons; falls back to native smooth scrolling without Lenis. */
export function scrollToTarget(target: string | HTMLElement) {
  if (lenis) {
    lenis.scrollTo(target, { duration: 1.6 });
    return;
  }
  const el = typeof target === "string" ? document.querySelector(target) : target;
  el?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}
