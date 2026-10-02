import { ytFx } from "@/lib/yt/state";

export const BEAT_MS = 1600;

/** Progress of the current beat after `fireBeat()`: 0..1 while it plays, -1 when idle. The button jolts, its cracks flare and chips fall off. */
export function beatAt(now: number): number {
  const age = now - ytFx.beatAt;
  if (ytFx.beatAt < 0 || age < 0 || age > BEAT_MS) return -1;
  return age / BEAT_MS;
}
