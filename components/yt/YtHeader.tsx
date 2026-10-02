"use client";

import { useEffect, useRef } from "react";
import { asset } from "@/lib/asset";
import { AUDIT_URL, ytCopy } from "@/lib/yt/copy";
import { PlayMark } from "./PlayMark";

/** Slim glass bar: AIR logo, product name and a compact CTA. Slides down with the hero intro once the loader lifts; nearly clear at the top, it turns solid once the page scrolls. */
export function YtHeader() {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    // Toggles a class instead of state so scrolling never re-renders React.
    const sync = () => el.classList.toggle("is-scrolled", window.scrollY > 40);
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, []);

  return (
    <header data-intro className="fixed inset-x-0 top-0 z-40 px-4 pt-4 md:px-12" style={{ "--i": 0 } as React.CSSProperties}>
      <div ref={bar} className="yt-glass yt-header-bar mx-auto flex max-w-[98rem] items-center justify-between gap-4 rounded-full py-2 pl-5 pr-2">
        <a href="https://air.io" className="-my-3 flex items-center gap-3 py-3" aria-label="AIR home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("/yt/air-logo.svg")} alt="AIR" width={157} height={31} className="h-5 w-auto" />
          <span className="hidden h-4 w-px bg-white/15 sm:block" />
          <span className="hidden items-center gap-2 text-sm font-medium text-white sm:flex">
            <PlayMark className="h-3.5 w-auto" />
            {ytCopy.product}
          </span>
        </a>
        <a href={AUDIT_URL} data-magnetic className="yt-btn-primary yt-header-cta inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium">
          {ytCopy.nav.cta}
          <span aria-hidden="true" className="yt-header-arrow">→</span>
        </a>
      </div>
    </header>
  );
}
