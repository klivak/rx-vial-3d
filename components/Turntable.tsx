"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { turntable } from "@/lib/sceneState";

const RADIANS_PER_PX = 0.008;

/**
 * Horizontal drag spins the camera around the vial on the last frame. The canvas keeps touch-action: pan-y, so the browser
 * still scrolls on vertical swipes and only horizontal drags reach these handlers.
 */
export function Turntable({ enabled }: { enabled: boolean }) {
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    gl.domElement.style.touchAction = "pan-y";
  }, [gl]);

  useEffect(() => {
    turntable.enabled = enabled;
    invalidate();
    if (!enabled) return;
    const el = gl.domElement;
    let lastX = 0;
    let lastT = 0;

    const down = (e: PointerEvent) => {
      turntable.dragging = true;
      turntable.velocity = 0;
      lastX = e.clientX;
      lastT = e.timeStamp;
      el.setPointerCapture(e.pointerId);
      el.style.cursor = "grabbing";
    };
    const move = (e: PointerEvent) => {
      if (!turntable.dragging) return;
      const d = -(e.clientX - lastX) * RADIANS_PER_PX;
      const dt = Math.max(1, e.timeStamp - lastT) / 1000;
      turntable.offset += d;
      turntable.velocity = d / dt;
      lastX = e.clientX;
      lastT = e.timeStamp;
      invalidate();
    };
    const up = () => {
      turntable.dragging = false;
      el.style.cursor = "grab";
      invalidate();
    };

    el.style.cursor = "grab";
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      up();
      el.style.cursor = "";
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, [enabled, gl, invalidate]);

  return null;
}
