import { Color, DoubleSide, MeshPhysicalMaterial, MeshStandardMaterial, type Material } from "three";
import type { Quality } from "@/lib/quality";
import { createCapNormalTexture } from "@/lib/textures/capNormal";

const AMBER = "#A85A16";

export function createGlassMaterial(quality: Quality): Material {
  if (quality === "high") {
    return new MeshPhysicalMaterial({
      color: "#F2B878",
      transmission: 1,
      thickness: 0.004,
      roughness: 0.08,
      ior: 1.5,
      attenuationColor: new Color(AMBER),
      attenuationDistance: 0.005,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      envMapIntensity: 1.2,
    });
  }
  // Transmission costs an extra render pass; phones and AR viewers get classic alpha glass instead.
  return new MeshPhysicalMaterial({
    color: AMBER,
    transparent: true,
    opacity: quality === "ar" ? 0.7 : 0.62,
    roughness: 0.1,
    clearcoat: quality === "ar" ? 0 : 1,
    envMapIntensity: 1.4,
    side: DoubleSide,
    depthWrite: false,
  });
}

export function createLiquidMaterial(): Material {
  return new MeshStandardMaterial({ color: "#5A2A08", roughness: 0.2 });
}

/** CylinderGeometry groups: 0 side, 1 top, 2 bottom. Only the side is knurled. */
export function createCapMaterials(color: string): MeshStandardMaterial[] {
  const side = new MeshStandardMaterial({ color, roughness: 0.65, normalMap: createCapNormalTexture() });
  const top = new MeshStandardMaterial({ color, roughness: 0.6 });
  return [side, top, top];
}
