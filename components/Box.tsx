"use client";

import { ContactShadows } from "@react-three/drei/core/ContactShadows";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { Color } from "three";
import { BOX, buildBox } from "@/lib/scene/buildBox";
import { sceneState } from "@/lib/sceneState";

const GLOW = new Color("#FFC890");
/** Smooth 0..1 window of `t` between a and b. */
const ramp = (t: number, a: number, b: number) => {
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};

export function Box() {
  const parts = useMemo(() => buildBox(), []);
  useEffect(() => parts.dispose, [parts]);

  useFrame(() => {
    const out = 1 - sceneState.boxIn;
    parts.group.visible = sceneState.boxIn > 0.001;
    parts.group.position.x = BOX.position[0] + out * 0.12;
    parts.group.position.z = BOX.position[2] - out * 0.08;
    const lid = sceneState.boxLid;
    parts.lidPivot.rotation.x = -lid * BOX.lidOpenAngle;
    // The card peeks out once the lid has cleared it, the inner light blooms with the opening, then the loose capsules pop in one by one.
    const peek = ramp(lid, 0.35, 1);
    parts.card.position.set(0, BOX.height * 0.42 + peek * 0.018, -BOX.depth * 0.18);
    parts.glowMaterial.opacity = ramp(lid, 0.1, 0.7) * 0.55;
    parts.glow.visible = parts.glowMaterial.opacity > 0.001;
    parts.loose.forEach((m, i) => m.scale.setScalar(ramp(lid, 0.55 + i * 0.12, 0.8 + i * 0.12)));
    for (const m of parts.materials) {
      m.emissive.copy(GLOW);
      m.emissiveIntensity = sceneState.hBox * 0.3;
    }
  });

  // The box never moves relative to its own floor patch, so its shadow is baked once and travels with it.
  return (
    <primitive object={parts.group}>
      <ContactShadows opacity={0.4} scale={0.2} blur={2.6} far={0.06} resolution={256} frames={2} color="#3B2A1A" />
    </primitive>
  );
}
