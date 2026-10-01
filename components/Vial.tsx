"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { Color, type MeshStandardMaterial } from "three";
import { capColorValue, getCapColor, useCapColor } from "@/lib/capColor";
import { useQuality } from "@/lib/quality";
import { buildVial } from "@/lib/scene/buildVial";
import { sceneState } from "@/lib/sceneState";

const GLOW = new Color("#FFC890");
const SWAY = (2 / 180) * Math.PI;
const SHINE = new Color("#FFFFFF");
const capTarget = new Color();

function setGlow(materials: MeshStandardMaterial[], amount: number, shine = 0) {
  for (const m of materials) {
    m.emissive.copy(GLOW).lerp(SHINE, shine);
    m.emissiveIntensity = amount * 0.35 + shine * 0.45;
  }
}

export function Vial() {
  const quality = useQuality();
  const capColor = useCapColor();
  // Built with whatever colour is current; later changes are animated below instead of rebuilding.
  const parts = useMemo(() => buildVial({ quality, capColor: capColorValue(getCapColor()) }), [quality]);
  useEffect(() => parts.dispose, [parts]);
  const invalidate = useThree((s) => s.invalidate);
  // A short flash of light on the cap whenever the colour changes (not on mount), decaying in the frame loop below.
  const shine = useMemo(() => ({ value: 0, mounted: false }), []);
  useEffect(() => {
    if (shine.mounted) shine.value = 1;
    shine.mounted = true;
    invalidate();
  }, [capColor, invalidate, shine]);

  const capMaterials = parts.cap.material as MeshStandardMaterial[];
  const labelMaterial = parts.label.material as MeshStandardMaterial;

  useFrame(({ clock, invalidate }, delta) => {
    const s = sceneState;
    // Idle sway (+-2 degrees) is weighted by `idle`, so it fades in and out with the scroll instead of popping.
    const sway = Math.sin(clock.elapsedTime * 0.6) * SWAY * s.idle;
    parts.group.rotation.y = s.vialRotY + sway;
    parts.group.position.y = s.vialLift;
    shine.value = shine.value < 0.01 ? 0 : shine.value * Math.exp(-delta * 4);
    setGlow(capMaterials, s.hCap, shine.value);
    setGlow([labelMaterial], s.hLabel);

    // ~300 ms exponential ease toward the picked cap colour.
    capTarget.set(capColorValue(capColor));
    const k = 1 - Math.exp(-delta * 12);
    let settling = false;
    for (const m of new Set(capMaterials)) {
      m.color.lerp(capTarget, k);
      if (Math.abs(m.color.r - capTarget.r) + Math.abs(m.color.g - capTarget.g) + Math.abs(m.color.b - capTarget.b) > 0.002) settling = true;
    }

    if (s.idle > 0.001 || settling || shine.value > 0) invalidate();
  });

  return <primitive object={parts.group} />;
}
