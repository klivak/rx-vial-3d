import { useSyncExternalStore } from "react";
import { theme } from "@/lib/theme";

export type CapColorId = (typeof theme.capColors)[number]["id"];

const ids = theme.capColors.map((c) => c.id) as CapColorId[];
const listeners = new Set<() => void>();
let current: CapColorId | null = null;

/** The choice lives in the URL hash (#cap=graphite) so a configured product can be shared as a link. */
function fromHash(): CapColorId {
  if (typeof window === "undefined") return ids[0];
  const match = /cap=(\w+)/.exec(window.location.hash);
  return match && ids.includes(match[1] as CapColorId) ? (match[1] as CapColorId) : ids[0];
}

export function getCapColor(): CapColorId {
  return (current ??= fromHash());
}

export function capColorValue(id: CapColorId): string {
  return theme.capColors.find((c) => c.id === id)!.value;
}

export function setCapColor(id: CapColorId) {
  current = id;
  history.replaceState(null, "", `#cap=${id}`);
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useCapColor(): CapColorId {
  return useSyncExternalStore(subscribe, getCapColor, () => ids[0]);
}
