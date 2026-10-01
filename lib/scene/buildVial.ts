import { CylinderGeometry, Group, LatheGeometry, Mesh, MeshStandardMaterial, type Material } from "three";
import { VIAL, glassProfile } from "@/lib/geometry/vialProfile";
import { createCapMaterials, createCapsuleMaterial, createGlassMaterial } from "@/lib/materials";
import { createCapsulePileGeometry } from "@/lib/scene/buildCapsules";
import type { Quality } from "@/lib/quality";
import { createLabelTexture } from "@/lib/textures/label";

export type VialParts = {
  group: Group;
  glass: Mesh;
  capsules: Mesh;
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

  // The label promises 30 capsules, so the vial holds a pile of them instead of a flat liquid fill.
  const capsules = new Mesh(
    createCapsulePileGeometry({ detail: quality === "high" ? "high" : "low", innerRadius: VIAL.innerRadius, floor: VIAL.innerFloor, top: VIAL.fillTop }),
    createCapsuleMaterial(),
  );
  capsules.name = "Capsules";
  capsules.renderOrder = 1;

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

  const meshes = [glass, capsules, label, cap];
  meshes.forEach((m) => group.add(m));

  const dispose = () => {
    for (const m of meshes) {
      m.geometry.dispose();
      const mats = (Array.isArray(m.material) ? m.material : [m.material]) as Material[];
      new Set(mats).forEach((mat) => mat.dispose());
    }
  };

  return { group, glass, capsules, label, cap, dispose };
}
