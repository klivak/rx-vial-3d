"use client";

import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useRef, type ComponentRef } from "react";
import { sceneState } from "@/lib/sceneState";

/**
 * Last-frame turntable. Rotation is locked to the horizontal axis and the canvas keeps touch-action: pan-y,
 * so a vertical swipe still scrolls the page while a horizontal drag spins the vial.
 */
export function Orbit() {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    const c = controls.current;
    if (c) {
      const polar = c.getPolarAngle();
      c.minPolarAngle = c.maxPolarAngle = polar;
    }
    const el = gl.domElement;
    el.style.touchAction = "pan-y";
    el.style.cursor = "grab";
    return () => {
      el.style.cursor = "";
    };
  }, [gl]);

  return (
    <OrbitControls
      ref={controls}
      target={[sceneState.targetX, sceneState.targetY, sceneState.targetZ]}
      enableZoom={false}
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.6}
    />
  );
}
