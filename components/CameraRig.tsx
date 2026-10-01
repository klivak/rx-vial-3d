"use client";

import { useFrame } from "@react-three/fiber";
import { sceneState } from "@/lib/sceneState";

/** Places the camera on its orbit around the current target. Disabled once OrbitControls take over on the last frame. */
export function CameraRig({ enabled = true }: { enabled?: boolean }) {
  useFrame(({ camera }) => {
    if (!enabled) return;
    const s = sceneState;
    camera.position.set(
      s.targetX + Math.sin(s.azimuth) * s.radius,
      s.camY,
      s.targetZ + Math.cos(s.azimuth) * s.radius,
    );
    camera.lookAt(s.targetX, s.targetY, s.targetZ);
  });
  return null;
}
