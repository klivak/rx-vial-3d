import type { CSSProperties } from "react";
import { ScrollHint } from "@/components/ScrollHint";
import { AUDIT_URL, ytCopy } from "@/lib/yt/copy";

const stagger = (i: number) => ({ "--i": i }) as CSSProperties;
const c = ytCopy.hero;

/** Screen 1. Text on the left, the 3D button on the right (below the text on phones). Static HTML, so the headline is the LCP. */
export function YtHero() {
  return (
    <section
      data-yt-frame="hero"
      className="relative flex min-h-svh flex-col justify-start px-6 pt-[13svh] md:justify-center md:px-16 md:pt-0"
    >
      <div className="max-w-xl md:max-w-[34rem] lg:max-w-[38rem]">
        <p data-intro style={stagger(1)} className="yt-eyebrow">
          <span className="yt-live-dot" aria-hidden="true" />
          {c.eyebrow}
        </p>
        <h1 data-intro style={stagger(2)} className="mt-5 text-[2.25rem] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-6xl lg:text-7xl">
          {c.title}
        </h1>
        <p data-intro style={stagger(3)} className="mt-5 max-w-md text-[0.95rem] leading-relaxed sm:mt-6 text-muted sm:text-lg">
          {c.lead}
        </p>
        <div data-intro style={stagger(4)} className="mt-7 flex flex-wrap items-center gap-3 sm:mt-8">
          <a href={AUDIT_URL} className="yt-btn-primary rounded-full px-6 py-3.5 text-sm font-medium sm:text-base">
            {c.cta}
          </a>
          <a href="#scan" className="yt-btn-ghost rounded-full px-6 py-3.5 text-sm font-medium sm:text-base">
            {c.secondary}
          </a>
        </div>
        <p data-intro style={stagger(5)} className="mt-4 text-sm text-muted">
          {c.note}
        </p>
      </div>
      <p data-intro style={stagger(6)} aria-hidden="true" className="yt-press-hint pointer-events-none absolute hidden text-xs uppercase tracking-[0.25em] text-muted md:block">
        {c.hint}
      </p>
      <div className="absolute inset-x-0 bottom-0 hidden h-28 justify-center md:flex">
        <ScrollHint />
      </div>
    </section>
  );
}
