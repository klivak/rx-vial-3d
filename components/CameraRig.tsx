"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect } from "react";
import { parallax, startParallax } from "@/lib/parallax";
import { sceneState, turntable } from "@/lib/sceneState";

/** Radians of orbit and metres of height the pointer or tilt can add on top of the authored camera. */
const PARALLAX_AZIMUTH = 0.06;
const PARALLAX_HEIGHT = 0.008;
const smooth = { x: 0, y: 0 };

/** Places the camera on its orbit around the current target; the turntable drag is an extra azimuth offset on top of the scroll state. */
export function CameraRig() {
  useEffect(() => startParallax(), []);

  useFrame(({ camera, invalidate, clock }, delta) => {
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

    // Parallax follows the pointer with a soft lag; keep drawing until it has caught up.
    const k = 1 - Math.exp(-delta * 3);
    smooth.x += (parallax.x - smooth.x) * k;
    smooth.y += (parallax.y - smooth.y) * k;
    if (Math.abs(parallax.x - smooth.x) + Math.abs(parallax.y - smooth.y) > 1e-3) invalidate();

    const s = sceneState;
    // On the resting frames the camera breathes a few millimetres, weighted by `idle` like the vial sway.
    const time = clock.elapsedTime;
    const azimuth = s.azimuth + t.offset + smooth.x * PARALLAX_AZIMUTH + Math.sin(time * 0.31) * 0.012 * s.idle;
    const camY = s.camY - smooth.y * PARALLAX_HEIGHT + Math.sin(time * 0.47) * 0.0025 * s.idle;
    camera.position.set(s.targetX + Math.sin(azimuth) * s.radius, camY, s.targetZ + Math.cos(azimuth) * s.radius);
    camera.lookAt(s.targetX, s.targetY, s.targetZ);
  });
  return null;
}
