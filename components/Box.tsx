"use client";

import { ContactShadows } from "@react-three/drei/core/ContactShadows";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { Color } from "three";
import { BOX, buildBox } from "@/lib/scene/buildBox";
import { sceneState } from "@/lib/sceneState";

const GLOW = new Color("#FFC890");

export function Box() {
  const parts = useMemo(() => buildBox(), []);
  useEffect(() => parts.dispose, [parts]);

  useFrame(() => {
    const out = 1 - sceneState.boxIn;
    parts.group.visible = sceneState.boxIn > 0.001;
    parts.group.position.x = BOX.position[0] + out * 0.12;
    parts.group.position.z = BOX.position[2] - out * 0.08;
    parts.lidPivot.rotation.x = -sceneState.boxLid * BOX.lidOpenAngle;
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
