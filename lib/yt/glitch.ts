import { ytFx } from "@/lib/yt/state";

const BURST_MS = 640;

export type GlitchFrame = {
  /** 0 when idle; otherwise the burst envelope (rises fast, settles slowly). */
  strength: number;
  /** Small sideways sway of the whole button, as a share of its height. */
  shiftX: number;
  /** Offset of the red and cyan colour-split ghosts. */
  split: number;
  /** 0..1: the red liquid surges up for a moment and drains again (a smooth bump, peaking early in the burst). */
  surge: number;
};

const idle: GlitchFrame = { strength: 0, shiftX: 0, split: 0, surge: 0 };

/**
 * A soft "signal hiccup" after each `fireGlitch()`: the colour channels drift apart and back, the button sways a little on a
 * decaying wave and the red liquid surges up and drains again. Everything is continuous (no stepped jumps), so it reads as a glitch
 * in the picture, not as the button being shaken.
 */
export function glitchAt(now: number): GlitchFrame {
  const age = now - ytFx.glitchAt;
  if (ytFx.glitchAt < 0 || age < 0 || age > BURST_MS) return idle;
  const a = age / BURST_MS;
  // Quick attack, long ease-out.
  const envelope = Math.min(1, a / 0.12) * Math.pow(1 - a, 2);
  const side = ytFx.glitchSeed % 2 < 1 ? 1 : -1;
  return {
    strength: envelope,
    shiftX: side * Math.sin(a * Math.PI * 4) * 0.018 * envelope,
    split: 0.05 * envelope,
    surge: Math.pow(Math.sin(Math.min(1, a / 0.7) * Math.PI), 2),
  };
}
