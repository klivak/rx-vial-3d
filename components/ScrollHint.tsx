"use client";

import { useEffect, useState } from "react";

/** "Scroll" cue on the hero with a falling line; fades out for good once the visitor starts scrolling. */
export function ScrollHint() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const check = () => {
      if (window.scrollY < 24) return;
      setHidden(true);
      window.removeEventListener("scroll", check);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, []);

  return (
    <div aria-hidden="true" className={`absolute bottom-8 flex flex-col items-center gap-3 transition-all duration-500 ${hidden ? "translate-y-2 opacity-0" : "opacity-100"}`}>
      <span className="text-xs uppercase tracking-[0.2em] text-muted">Scroll</span>
      <span className="relative h-10 w-px overflow-hidden bg-foreground/15">
        <span className="scroll-cue absolute inset-x-0 top-0 h-1/2 bg-foreground/60" />
      </span>
    </div>
  );
}
