"use client";

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
    parts.lidPivot.rotation.x = -sceneState.boxLid * BOX.lidOpenAngle;
    for (const m of parts.materials) {
      m.emissive.copy(GLOW);
      m.emissiveIntensity = sceneState.hBox * 0.3;
    }
  });

  return <primitive object={parts.group} />;
}
