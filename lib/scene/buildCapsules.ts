import { BufferAttribute, CapsuleGeometry, Color, Euler, Matrix4, Quaternion, Vector3, type BufferGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/** Real capsule proportions (size 0 is ~21 x 7.6 mm), scaled down a little to suit the 4 cm vial. */
export const CAPSULE = { radius: 0.0034, length: 0.0105 } as const;

const SHELL_A = new Color("#F3EEE4");
const SHELL_B = new Color("#2F5D50");

/** One two-tone capsule along +y, coloured per vertex so a whole pile can share one material and one draw call. */
export function createCapsuleGeometry(detail: "high" | "low"): BufferGeometry {
  const geometry = detail === "high" ? new CapsuleGeometry(CAPSULE.radius, CAPSULE.length, 6, 14) : new CapsuleGeometry(CAPSULE.radius, CAPSULE.length, 3, 8);
  const pos = geometry.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) (pos.getY(i) > 0 ? SHELL_B : SHELL_A).toArray(colors, i * 3);
  geometry.setAttribute("color", new BufferAttribute(colors, 3));
  return geometry;
}

/**
 * A settled pile of capsules inside the vial, merged into a single geometry: one draw call on the site, and plain mesh data that
 * GLTFExporter and USDZExporter both understand (instancing would not survive the USDZ export).
 */
export function createCapsulePileGeometry({ detail, innerRadius, floor, top }: { detail: "high" | "low"; innerRadius: number; floor: number; top: number }): BufferGeometry {
  const base = createCapsuleGeometry(detail);
  const parts: BufferGeometry[] = [];
  const m = new Matrix4();
  const q = new Quaternion();
  const e = new Euler();
  const p = new Vector3();
  const one = new Vector3(1, 1, 1);
  let seed = 11;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  // Capsules lie roughly flat in layers; each layer is a ring plus a centre one, rotated so the layers interlock.
  const layerHeight = CAPSULE.radius * 1.9;
  const ringRadius = innerRadius - 0.0065;
  for (let layer = 0, y = floor + CAPSULE.radius; y < top; layer++, y += layerHeight) {
    const count = 5;
    for (let i = 0; i <= count; i++) {
      const centre = i === count;
      const a = (i / count) * Math.PI * 2 + layer * 0.7 + rand() * 0.3;
      const r = centre ? rand() * 0.002 : ringRadius;
      p.set(Math.cos(a) * r, y + (rand() - 0.5) * 0.0015, Math.sin(a) * r);
      // Tangent to the ring, tipped a little so the pile does not look stacked by a machine.
      e.set(Math.PI / 2 + (rand() - 0.5) * 0.5, -a + (centre ? rand() * 3 : 0), (rand() - 0.5) * 0.4, "YXZ");
      q.setFromEuler(e);
      m.compose(p, q, one);
      parts.push(base.clone().applyMatrix4(m));
    }
  }
  const merged = mergeGeometries(parts)!;
  parts.forEach((g) => g.dispose());
  base.dispose();
  return merged;
}
