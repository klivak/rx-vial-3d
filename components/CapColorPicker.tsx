"use client";

import { useRef, type KeyboardEvent } from "react";
import { setCapColor, useCapColor, type CapColorId } from "@/lib/capColor";
import { theme } from "@/lib/theme";

/** Radio group with roving tabindex: Tab enters once, arrow keys move the choice, like native radios. */
export function CapColorPicker() {
  const selected = useCapColor();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const options = theme.capColors;

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (index + step + options.length) % options.length;
    setCapColor(options[next].id as CapColorId);
    refs.current[next]?.focus();
  };

  return (
    <div role="radiogroup" aria-label="Cap colour" className="flex items-center gap-3">
      {options.map((c, i) => {
        const checked = c.id === selected;
        return (
          <button
            key={c.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={c.label}
            tabIndex={checked ? 0 : -1}
            onClick={() => setCapColor(c.id as CapColorId)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`h-7 w-7 rounded-full border border-foreground/20 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background ${checked ? "scale-110 ring-2 ring-foreground/60 ring-offset-2 ring-offset-background" : ""}`}
            style={{ backgroundColor: c.value }}
          />
        );
      })}
    </div>
  );
}
