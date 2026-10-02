"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect } from "react";

gsap.registerPlugin(ScrollTrigger);

/**
 * Scroll motion of the HTML layer, independent of WebGL so it also runs on the poster fallback:
 * - headings: words rise out of their line masks, then `[data-reveal]` lines follow;
 * - `[data-draw]` SVG paths draw themselves with the scroll;
 * - `[data-light]` items light up one after another while their list scrolls through the middle of the screen.
 * Reduced motion leaves everything in place.
 */
export function YtMotion() {
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.utils.toArray<HTMLElement>("[data-yt-frame]").forEach((section, i) => {
        // The hero is server-rendered and plays its CSS intro after the loader; animating it here would make the LCP text flash.
        if (i === 0) return;
        const words = section.querySelectorAll("[data-word]");
        const items = section.querySelectorAll("[data-reveal]");
        const tl = gsap.timeline({ scrollTrigger: { trigger: section, start: "top 55%", toggleActions: "play none none reverse" } });
        if (words.length) tl.from(words, { yPercent: 115, rotate: 3, duration: 0.9, ease: "power4.out", stagger: 0.045 });
        if (items.length) tl.from(items, { opacity: 0, y: 26, filter: "blur(6px)", duration: 0.9, ease: "power3.out", stagger: 0.08 }, words.length ? "-=0.6" : 0);
      });

      gsap.utils.toArray<SVGPathElement>("[data-draw]").forEach((path) => {
        const length = path.getTotalLength();
        gsap.fromTo(
          path,
          { strokeDasharray: length, strokeDashoffset: length },
          { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: path.closest("[data-yt-frame]") ?? path, start: "top 60%", end: "center 40%", scrub: 0.8 } },
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-light-group]").forEach((group) => {
        const lights = group.querySelectorAll<HTMLElement>("[data-light]");
        const tl = gsap.timeline({ scrollTrigger: { trigger: group, start: "top 70%", end: "bottom 45%", scrub: 0.6 } });
        lights.forEach((el, i) => tl.fromTo(el, { "--lit": 0 }, { "--lit": 1, duration: 1, ease: "power1.inOut" }, i * 0.6));
      });
    });
    return () => mm.revert();
  }, []);

  return null;
}
