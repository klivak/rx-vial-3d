import { Color } from "three";
import type { PlayButton } from "@/lib/yt/buildPlayButton";

type Finish = {
  body: string;
  metalness: number;
  roughness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  iridescence: number;
  env: number;
  triangle: string;
  triangleMetalness: number;
  triangleRoughness: number;
  /** Self-light on the triangle so it never reads as a dull grey. */
  triangleGlow: number;
  /** Faint inner light (the diamond's crystal glow). */
  emissive: string;
  emissiveIntensity: number;
  /** Colour of the light band that sweeps across the face while the button is "plated" with this finish. */
  sweep: string;
};

/**
 * Red lacquer, then the creator awards as they look in hand: Silver is bright mirror chrome, Gold is rich polished yellow gold with a warm inner glow, Diamond is an icy crystal with a strong thin-film rainbow and a blue inner glow (the sparkles do the rest).
 */
const finishes: Finish[] = [
  { body: "#FF0033", metalness: 0, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.08, iridescence: 0.001, env: 1.1, triangle: "#FFFFFF", triangleMetalness: 0, triangleRoughness: 0.38, triangleGlow: 0.22, sweep: "#FFFFFF", emissive: "#000000", emissiveIntensity: 0 },
  { body: "#E6EBF2", metalness: 1, roughness: 0.13, clearcoat: 1, clearcoatRoughness: 0.04, iridescence: 0.001, env: 1.05, triangle: "#F4F7FB", triangleMetalness: 1, triangleRoughness: 0.18, triangleGlow: 0.06, sweep: "#FFFFFF", emissive: "#9FB4D6", emissiveIntensity: 0.05 },
  { body: "#FFA60F", metalness: 1, roughness: 0.16, clearcoat: 0.2, clearcoatRoughness: 0.06, iridescence: 0.001, env: 1.1, triangle: "#FFC02E", triangleMetalness: 1, triangleRoughness: 0.2, triangleGlow: 0.06, sweep: "#FFE08A", emissive: "#FF9400", emissiveIntensity: 0.07 },
  { body: "#C4E0FF", metalness: 0.75, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.02, iridescence: 0.95, env: 1.3, triangle: "#FFFFFF", triangleMetalness: 0.4, triangleRoughness: 0.04, triangleGlow: 0.28, sweep: "#BFE0FF", emissive: "#4F8DFF", emissiveIntensity: 0.32 },
];

const parsed = finishes.map((f) => ({
  ...f,
  bodyColor: new Color(f.body),
  triangleColor: new Color(f.triangle),
  sweepColor: new Color(f.sweep),
  emissiveColor: new Color(f.emissive),
}));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export type FinishResult = {
  triangleGlow: number;
  /** -1 while a finish is resting; 0..1 while the next one is being plated on (position of the light band). */
  sweep: number;
  sweepColor: Color;
};

/**
 * Blends between the finishes around `tier` (0..3) and writes them into the button's materials. Each finish rests for the first and
 * last fifth of its stretch; the change in between is eased, so it reads as one smooth plating rather than a muddy mix.
 * `lacquer` then pulls the result straight back to red lacquer (the call to action), so the diamond never passes through gold and
 * silver on its way back; the scroll already eases it, so it blends linearly with one light band of its own.
 * Iridescence and clearcoat never reach zero, so no blend ever forces a shader recompile.
 */
export function applyFinish(button: PlayButton, tier: number, lacquer = 0): FinishResult {
  const t = Math.min(3, Math.max(0, tier));
  const i = Math.min(2, Math.floor(t));
  const f = t >= 3 ? 1 : t - i;
  const e = Math.min(1, Math.max(0, (f - 0.2) / 0.6));
  const k = e * e * (3 - 2 * e);
  const r = Math.min(1, Math.max(0, lacquer));
  if (r > 0) return blendToLacquer(button, parsed[i], parsed[i + 1], k, r);
  const a = parsed[i];
  const b = parsed[i + 1];
  const body = button.bodyMaterial;
  body.color.copy(a.bodyColor).lerp(b.bodyColor, k);
  body.metalness = lerp(a.metalness, b.metalness, k);
  body.roughness = lerp(a.roughness, b.roughness, k);
  body.clearcoat = Math.max(0.05, lerp(a.clearcoat, b.clearcoat, k));
  body.clearcoatRoughness = lerp(a.clearcoatRoughness, b.clearcoatRoughness, k);
  body.iridescence = Math.max(0.001, lerp(a.iridescence, b.iridescence, k));
  body.envMapIntensity = lerp(a.env, b.env, k);
  body.emissive.copy(a.emissiveColor).lerp(b.emissiveColor, k);
  body.emissiveIntensity = lerp(a.emissiveIntensity, b.emissiveIntensity, k);
  const tri = button.triangleMaterial;
  tri.color.copy(a.triangleColor).lerp(b.triangleColor, k);
  tri.metalness = lerp(a.triangleMetalness, b.triangleMetalness, k);
  tri.roughness = lerp(a.triangleRoughness, b.triangleRoughness, k);
  tri.envMapIntensity = lerp(a.env, b.env, k) * 0.9;
  return {
    triangleGlow: lerp(a.triangleGlow, b.triangleGlow, k),
    sweep: e > 0 && e < 1 ? e : -1,
    sweepColor: b.sweepColor,
  };
}

type Parsed = (typeof parsed)[number];
const mixColor = (out: Color, a: Color, b: Color, k: number, red: Color, r: number) => out.copy(a).lerp(b, k).lerp(red, r);
const mix = (a: number, b: number, k: number, red: number, r: number) => lerp(lerp(a, b, k), red, r);

/** The metal blend of `a` → `b` at `k`, pulled towards red lacquer by `r` (0..1). */
function blendToLacquer(button: PlayButton, a: Parsed, b: Parsed, k: number, r: number): FinishResult {
  const red = parsed[0];
  const body = button.bodyMaterial;
  mixColor(body.color, a.bodyColor, b.bodyColor, k, red.bodyColor, r);
  body.metalness = mix(a.metalness, b.metalness, k, red.metalness, r);
  body.roughness = mix(a.roughness, b.roughness, k, red.roughness, r);
  body.clearcoat = Math.max(0.05, mix(a.clearcoat, b.clearcoat, k, red.clearcoat, r));
  body.clearcoatRoughness = mix(a.clearcoatRoughness, b.clearcoatRoughness, k, red.clearcoatRoughness, r);
  body.iridescence = Math.max(0.001, mix(a.iridescence, b.iridescence, k, red.iridescence, r));
  body.envMapIntensity = mix(a.env, b.env, k, red.env, r);
  mixColor(body.emissive, a.emissiveColor, b.emissiveColor, k, red.emissiveColor, r);
  body.emissiveIntensity = mix(a.emissiveIntensity, b.emissiveIntensity, k, red.emissiveIntensity, r);
  const tri = button.triangleMaterial;
  mixColor(tri.color, a.triangleColor, b.triangleColor, k, red.triangleColor, r);
  tri.metalness = mix(a.triangleMetalness, b.triangleMetalness, k, red.triangleMetalness, r);
  tri.roughness = mix(a.triangleRoughness, b.triangleRoughness, k, red.triangleRoughness, r);
  tri.envMapIntensity = mix(a.env, b.env, k, red.env, r) * 0.9;
  return {
    triangleGlow: mix(a.triangleGlow, b.triangleGlow, k, red.triangleGlow, r),
    sweep: r < 1 ? r : -1,
    sweepColor: red.sweepColor,
  };
}
