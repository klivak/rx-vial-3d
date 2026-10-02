import { ytFx } from "@/lib/yt/state";

const BURST_MS = 460;
/** The burst is cut into short slots; each slot holds one random pose, which is what makes it read as digital, not as a shake. */
const SLOT_MS = 46;

const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

export type GlitchFrame = {
  /** 0 when idle; otherwise the burst envelope, strongest at the start. */
  strength: number;
  /** Sideways jump and a small twist of the whole button. */
  shiftX: number;
  twist: number;
  /** Offset of the red and cyan colour-split ghosts. */
  split: number;
  /** True for slots in which the old red flashes back for an instant. */
  flash: boolean;
};

const idle: GlitchFrame = { strength: 0, shiftX: 0, twist: 0, split: 0, flash: false };

/** The glitch pose for this moment: a short burst after each `fireGlitch()`, then nothing. */
export function glitchAt(now: number): GlitchFrame {
  const age = now - ytFx.glitchAt;
  if (ytFx.glitchAt < 0 || age < 0 || age > BURST_MS) return idle;
  const strength = 1 - age / BURST_MS;
  const slot = Math.floor(age / SLOT_MS) + ytFx.glitchSeed;
  // A few slots are "clean" so the burst stutters rather than vibrates.
  if (hash(slot * 3.1) < 0.25) return { ...idle, strength };
  return {
    strength,
    shiftX: (hash(slot) - 0.5) * 0.16 * strength,
    twist: (hash(slot + 7) - 0.5) * 0.14 * strength,
    split: (0.03 + hash(slot + 13) * 0.07) * strength,
    flash: hash(slot + 21) > 0.62,
  };
}
