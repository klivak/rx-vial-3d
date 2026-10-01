"use client";

import { useEffect, useState } from "react";
import { ArButton } from "@/components/ArButton";
import { buttonBase } from "@/components/buttonStyles";
import { CapColorPicker } from "@/components/CapColorPicker";

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
        <ArButton />
      </div>
      <p role="status" aria-live="polite" className={`text-sm text-muted transition-opacity duration-300 ${toast ? "opacity-100" : "opacity-0"}`}>
        {toast ? "Demo only: no visit is booked." : ""}
      </p>
    </div>
  );
}
