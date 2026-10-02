import type { CSSProperties } from "react";
import { ScrollHint } from "@/components/ScrollHint";
import { AUDIT_URL, ytCopy } from "@/lib/yt/copy";

const stagger = (i: number) => ({ "--i": i }) as CSSProperties;
const c = ytCopy.hero;
const [before, after] = c.title.split(c.highlight);

/** Where each chip floats around the button, and how strongly it follows the mouse (nearer chips move more). */
const chipPlaces = ["yt-chip-a", "yt-chip-b", "yt-chip-c"];

/**
 * Screen 1. A narrow text column on the left, the 3D button on the right (below the text on phones) with three glass chips
 * floating around it. Static HTML, so the headline is the LCP.
 */
export function YtHero() {
  return (
    <section data-yt-frame="hero" className="relative px-6 md:px-16">
      {/* The column lets pointer events fall through to the 3D button; only the text block catches them. */}
      <div className="yt-container pointer-events-none! relative flex min-h-svh flex-col justify-start pt-[13svh] md:justify-center md:pt-0">
        <div className="pointer-events-auto max-w-xl md:max-w-[29rem] lg:max-w-[32rem]">
          <p data-intro style={stagger(1)} className="yt-eyebrow">
            <span className="yt-live-dot" aria-hidden="true" />
            {c.eyebrow}
          </p>
          <h1
            data-intro
            style={stagger(2)}
            className="mt-5 text-[2.25rem] font-semibold leading-[1.04] tracking-[-0.035em] sm:text-[3.4rem] lg:text-[4rem]"
          >
            {before}
            <span className="yt-hl">{c.highlight}</span>
            {after}
          </h1>
          <p
            data-intro
            style={stagger(3)}
            className="mt-5 max-w-md text-[0.95rem] leading-relaxed text-muted sm:mt-6 sm:text-[1.05rem]"
          >
            {c.lead}
          </p>
          <div
            data-intro
            style={stagger(4)}
            className="mt-7 flex flex-wrap items-center gap-3 sm:mt-8"
          >
            <a
              href={AUDIT_URL}
              data-magnetic
              className="yt-btn-primary rounded-full px-6 py-3.5 text-sm font-medium sm:text-base"
            >
              {c.cta}
            </a>
            <a
              href="#scan"
              data-magnetic
              className="yt-btn-ghost rounded-full px-6 py-3.5 text-sm font-medium sm:text-base"
            >
              {c.secondary}
            </a>
          </div>
          <p data-intro style={stagger(5)} className="mt-4 text-sm text-muted">
            {c.note}
          </p>
        </div>
        {/* Chips and the press hint live in one layer that fades away as the hero scrolls out (YtMotion). */}
        <div data-hero-fade aria-hidden="true" className="yt-hero-frame absolute inset-0 hidden md:block">
          <ul data-chips>
            {c.chips.map((chip, i) => (
              <li
                key={chip.label}
                data-intro
                style={stagger(6 + i)}
                className={`yt-chip ${chipPlaces[i]} absolute`}
              >
                <span className="yt-glass flex items-center gap-3 rounded-2xl px-4 py-3">
                  <span className="text-xl font-semibold tabular-nums">{chip.value}</span>
                  <span className="max-w-[7rem] text-xs leading-tight text-muted">
                    {chip.label}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <p
            data-intro
            style={stagger(9)}
            className="yt-press-hint absolute text-xs uppercase tracking-[0.25em] text-muted"
          >
            {c.hint}
          </p>
        </div>
        <div className="absolute inset-x-0 bottom-0 hidden h-28 justify-center md:flex">
          <ScrollHint />
        </div>
      </div>
    </section>
  );
}
