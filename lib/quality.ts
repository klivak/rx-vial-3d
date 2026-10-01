import { useSyncExternalStore } from "react";

/** high: transmission glass, dpr up to 2. low: plain transparency. ar: export for model-viewer. */
export type Quality = "high" | "low" | "ar";

function initialQuality(): Quality {
  if (typeof navigator === "undefined") return "low";
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const weakCpu = (navigator.hardwareConcurrency ?? 8) <= 4;
  return mobile || weakCpu ? "low" : "high";
}

let quality: Quality | null = null;
const listeners = new Set<() => void>();

export function getQuality(): Quality {
  return (quality ??= initialQuality());
}

export function setQuality(next: Quality) {
  if (next === getQuality()) return;
  quality = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useQuality(): Quality {
  return useSyncExternalStore(subscribe, getQuality, () => "low");
}
