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
 * Red lacquer, then the creator awards as they look in hand: Silver is polished steel-toned chrome with a satin triangle, Gold is
 * polished yellow gold, Diamond is an icy crystal with a thin-film rainbow and a faint inner glow (the sparkles do the rest).
 */
const finishes: Finish[] = [
  { body: "#FF0033", metalness: 0, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.08, iridescence: 0.001, env: 1.1, triangle: "#FFFFFF", triangleMetalness: 0, triangleRoughness: 0.38, triangleGlow: 0.22, sweep: "#FFFFFF", emissive: "#000000", emissiveIntensity: 0 },
  { body: "#AEB6C2", metalness: 1, roughness: 0.14, clearcoat: 0.6, clearcoatRoughness: 0.04, iridescence: 0.001, env: 1.1, triangle: "#C3C9D2", triangleMetalness: 1, triangleRoughness: 0.32, triangleGlow: 0, sweep: "#F4F7FF", emissive: "#000000", emissiveIntensity: 0 },
  { body: "#FFC75A", metalness: 1, roughness: 0.1, clearcoat: 0.4, clearcoatRoughness: 0.06, iridescence: 0.001, env: 1.7, triangle: "#E4AE45", triangleMetalness: 1, triangleRoughness: 0.34, triangleGlow: 0, sweep: "#FFE3A3", emissive: "#000000", emissiveIntensity: 0 },
  { body: "#D6E8FF", metalness: 0.7, roughness: 0.02, clearcoat: 1, clearcoatRoughness: 0.01, iridescence: 1, env: 1.8, triangle: "#F4FAFF", triangleMetalness: 0.4, triangleRoughness: 0.05, triangleGlow: 0.18, sweep: "#CFE6FF", emissive: "#7FB2FF", emissiveIntensity: 0.12 },
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
 * Iridescence and clearcoat never reach zero, so no blend ever forces a shader recompile.
 */
export function applyFinish(button: PlayButton, tier: number): FinishResult {
  const t = Math.min(3, Math.max(0, tier));
  const i = Math.min(2, Math.floor(t));
  const f = t >= 3 ? 1 : t - i;
  const e = Math.min(1, Math.max(0, (f - 0.2) / 0.6));
  const k = e * e * (3 - 2 * e);
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
