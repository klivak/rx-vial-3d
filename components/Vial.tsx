"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { Color, type MeshStandardMaterial } from "three";
import { useQuality } from "@/lib/quality";
import { buildVial } from "@/lib/scene/buildVial";
import { sceneState } from "@/lib/sceneState";
import { theme } from "@/lib/theme";

const GLOW = new Color("#FFC890");
const SWAY = (2 / 180) * Math.PI;

function setGlow(materials: MeshStandardMaterial[], amount: number) {
  for (const m of materials) {
    m.emissive.copy(GLOW);
    m.emissiveIntensity = amount * 0.35;
  }
}

export function Vial() {
  const quality = useQuality();
  const parts = useMemo(() => buildVial({ quality, capColor: theme.capColors[0].value }), [quality]);
  useEffect(() => parts.dispose, [parts]);

  const capMaterials = parts.cap.material as MeshStandardMaterial[];
  const labelMaterial = parts.label.material as MeshStandardMaterial;

  useFrame(({ clock, invalidate }) => {
    const s = sceneState;
    // Idle sway (+-2 degrees) is weighted by `idle`, so it fades in and out with the scroll instead of popping.
    const sway = Math.sin(clock.elapsedTime * 0.6) * SWAY * s.idle;
    parts.group.rotation.y = s.vialRotY + sway;
    parts.group.position.y = s.vialLift;
    setGlow(capMaterials, s.hCap);
    setGlow([labelMaterial], s.hLabel);
    if (s.idle > 0.001) invalidate();
  });

  return <primitive object={parts.group} />;
}
