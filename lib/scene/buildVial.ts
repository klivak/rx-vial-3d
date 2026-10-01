import { CylinderGeometry, Group, LatheGeometry, Mesh, MeshStandardMaterial, type Material } from "three";
import { VIAL, glassProfile, liquidProfile } from "@/lib/geometry/vialProfile";
import { createCapMaterials, createGlassMaterial, createLiquidMaterial } from "@/lib/materials";
import type { Quality } from "@/lib/quality";
import { createLabelTexture } from "@/lib/textures/label";

export type VialParts = {
  group: Group;
  glass: Mesh;
  liquid: Mesh;
  label: Mesh;
  cap: Mesh;
  dispose: () => void;
};

/** Plain Three.js (no React) so the website scene and the GLB/USDZ AR export share one source of truth. */
export function buildVial({ quality, capColor }: { quality: Quality; capColor: string }): VialParts {
  const segments = quality === "high" ? 96 : 48;
  const group = new Group();
  group.name = "Vial";

  const glass = new Mesh(new LatheGeometry(glassProfile, segments), createGlassMaterial(quality));
  glass.name = "Glass";
  glass.renderOrder = 2;

  const liquid = new Mesh(new LatheGeometry(liquidProfile, segments), createLiquidMaterial());
  liquid.name = "Liquid";
  liquid.renderOrder = 1;

  const labelRadius = VIAL.radius + 0.0003;
  const label = new Mesh(
    new CylinderGeometry(labelRadius, labelRadius, VIAL.labelHeight, segments, 1, true, -VIAL.labelArc / 2, VIAL.labelArc),
    new MeshStandardMaterial({ map: createLabelTexture(quality === "low" ? 512 : 1024), roughness: 0.5, envMapIntensity: 1.6 }),
  );
  label.name = "Label";
  label.position.y = VIAL.labelCenterY;
  label.renderOrder = 3;

  const cap = new Mesh(
    new CylinderGeometry(VIAL.capRadius, VIAL.capRadius, VIAL.capHeight, segments),
    createCapMaterials(capColor),
  );
  cap.name = "Cap";
  cap.position.y = VIAL.capBottom + VIAL.capHeight / 2;

  const meshes = [glass, liquid, label, cap];
  meshes.forEach((m) => group.add(m));

  const dispose = () => {
    for (const m of meshes) {
      m.geometry.dispose();
      const mats = (Array.isArray(m.material) ? m.material : [m.material]) as Material[];
      new Set(mats).forEach((mat) => mat.dispose());
    }
  };

  return { group, glass, liquid, label, cap, dispose };
}
