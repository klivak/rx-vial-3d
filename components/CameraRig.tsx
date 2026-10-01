"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Vector3 } from "three";
import { sceneState } from "@/lib/sceneState";

const goal = new Vector3();
const BLEND_SECONDS = 0.5;

/**
 * Places the camera on its orbit around the current target. Paused while OrbitControls own the camera on the last frame;
 * when it resumes it blends from wherever the user left the camera instead of snapping.
 */
export function CameraRig({ enabled = true }: { enabled?: boolean }) {
  const blend = useRef<{ from: Vector3; t: number } | null>(null);
  const wasEnabled = useRef(enabled);

  useFrame(({ camera, invalidate }, delta) => {
    if (!enabled) {
      wasEnabled.current = false;
      return;
    }
    if (!wasEnabled.current) {
      blend.current = { from: camera.position.clone(), t: 0 };
      wasEnabled.current = true;
    }
    const s = sceneState;
    goal.set(s.targetX + Math.sin(s.azimuth) * s.radius, s.camY, s.targetZ + Math.cos(s.azimuth) * s.radius);
    if (blend.current) {
      blend.current.t = Math.min(1, blend.current.t + delta / BLEND_SECONDS);
      const k = 1 - Math.pow(1 - blend.current.t, 3);
      camera.position.lerpVectors(blend.current.from, goal, k);
      if (blend.current.t >= 1) blend.current = null;
      else invalidate();
    } else {
      camera.position.copy(goal);
    }
    camera.lookAt(s.targetX, s.targetY, s.targetZ);
  });

  useEffect(() => {
    if (enabled) return;
    wasEnabled.current = false;
  }, [enabled]);

  return null;
}
