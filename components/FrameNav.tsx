"use client";

import { useEffect, useState } from "react";

const LABELS = ["Intro", "Formula", "How it works", "Packaging", "Get started"];

/** Side rail with one dot per frame (wide screens only; on phones it would sit on the text): shows where the story is and jumps to a frame on click. */
export function FrameNav() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-frame]"));
    // A section counts as current while it crosses the middle of the screen.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(sections.indexOf(e.target as HTMLElement));
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  const go = (i: number) => document.querySelectorAll("[data-frame]")[i]?.scrollIntoView({ behavior: "smooth" });

  return (
    <nav aria-label="Story progress" className="fixed right-6 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-1 md:flex">
      {LABELS.map((label, i) => (
        <button
          key={label}
          type="button"
          onClick={() => go(i)}
          aria-label={label}
          aria-current={i === active ? "step" : undefined}
          className="group flex h-6 w-6 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className={`block w-1.5 rounded-full transition-all duration-500 ease-out ${i === active ? "h-5 bg-foreground" : "h-1.5 bg-foreground/25 group-hover:bg-foreground/50"}`} />
        </button>
      ))}
    </nav>
  );
}
