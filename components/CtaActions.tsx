"use client";

import { useEffect, useState } from "react";
import { CapColorPicker } from "@/components/CapColorPicker";

export const buttonBase =
  "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function CtaActions() {
  const [toast, setToast] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(false), 2400);
    return () => clearTimeout(id);
  }, [toast]);

  return (
    <div data-reveal className="flex flex-col items-center gap-5">
      <CapColorPicker />
      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => setToast(true)} className={`${buttonBase} bg-foreground text-background hover:bg-accent`}>
          Start your visit
        </button>
        <button type="button" className={`${buttonBase} border border-foreground/20 hover:bg-foreground/5`}>
          View in AR
        </button>
      </div>
      <p role="status" aria-live="polite" className={`text-sm text-muted transition-opacity duration-300 ${toast ? "opacity-100" : "opacity-0"}`}>
        {toast ? "Demo only: no visit is booked." : ""}
      </p>
    </div>
  );
}
