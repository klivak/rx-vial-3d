"use client";

import { ContactShadows, PerformanceMonitor } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { lazy, Suspense, useEffect, useState } from "react";
import { Box } from "@/components/Box";
import { CameraRig } from "@/components/CameraRig";
import { ScrollTimeline } from "@/components/ScrollTimeline";
import { Turntable } from "@/components/Turntable";
import { Vial } from "@/components/Vial";
import { setQuality, useQuality } from "@/lib/quality";
import { createStudioEnvironment } from "@/lib/scene/studioEnvironment";

const debug = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug");
// The FPS panel is only downloaded with ?debug.
const Stats = lazy(() => import("@react-three/drei").then((m) => ({ default: m.Stats })));

function Studio() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const env = createStudioEnvironment(gl);
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
    };
  }, [gl, scene]);
  return null;
}

export default function Experience({ onReady, onLost }: { onReady: () => void; onLost: () => void }) {
  const quality = useQuality();
  const [orbit, setOrbit] = useState(false);

  return (
    <Canvas
      frameloop="demand"
      dpr={quality === "high" ? [1, 2] : [1, 1.5]}
      camera={{ position: [0, 0.06, 0.42], fov: 30, near: 0.01, far: 10 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl, invalidate }) => {
        requestAnimationFrame(onReady);
        // iOS drops WebGL contexts of background tabs: show the poster while lost, redraw once restored.
        const canvas = gl.domElement;
        canvas.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          onLost();
        });
        canvas.addEventListener("webglcontextrestored", () => {
          invalidate();
          requestAnimationFrame(onReady);
        });
      }}
    >
      <PerformanceMonitor onDecline={() => setQuality("low")} onIncline={() => setQuality("high")} flipflops={3} />
      <CameraRig />
      <ScrollTimeline onOrbit={setOrbit} />
      <Turntable enabled={orbit} />
      <Studio />
      <Vial />
      <Box />
      {/* Redrawn whenever the demand frameloop renders, so the shadow follows the vial lift. */}
      <ContactShadows opacity={0.45} scale={0.14} blur={2.2} far={0.06} resolution={256} color="#3B2A1A" />
      {debug && (
        <Suspense fallback={null}>
          <Stats />
        </Suspense>
      )}
    </Canvas>
  );
}
