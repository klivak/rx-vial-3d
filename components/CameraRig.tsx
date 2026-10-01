"use client";

import { useFrame } from "@react-three/fiber";
import { sceneState, turntable } from "@/lib/sceneState";

/** Places the camera on its orbit around the current target; the turntable drag is an extra azimuth offset on top of the scroll state. */
export function CameraRig() {
  useFrame(({ camera, invalidate }, delta) => {
    const t = turntable;
    if (!t.dragging) {
      t.offset += t.velocity * delta;
      t.velocity *= Math.exp(-delta * 4);
      if (Math.abs(t.velocity) < 1e-3) t.velocity = 0;
    }
    if (!t.enabled && !t.dragging) {
      // Scrolling away from the last frame eases the user's spin back to the authored angle.
      t.offset *= Math.exp(-delta * 6);
      if (Math.abs(t.offset) < 1e-4) t.offset = 0;
    }
    if (t.velocity !== 0 || (!t.enabled && t.offset !== 0)) invalidate();

    const s = sceneState;
    const azimuth = s.azimuth + t.offset;
    camera.position.set(s.targetX + Math.sin(azimuth) * s.radius, s.camY, s.targetZ + Math.cos(azimuth) * s.radius);
    camera.lookAt(s.targetX, s.targetY, s.targetZ);
  });
  return null;
}
