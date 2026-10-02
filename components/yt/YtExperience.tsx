"use client";

import { PerformanceMonitor } from "@react-three/drei/core/PerformanceMonitor";
import { Canvas, useThree } from "@react-three/fiber";
import { lazy, Suspense, useEffect } from "react";
import { PlaneGeometry } from "three";
import { PlayButton } from "@/components/yt/PlayButton";
import { YtScrollTimeline } from "@/components/yt/YtScrollTimeline";
import { setQuality, useQuality } from "@/lib/quality";
import { createStudioEnvironment, type StudioLight } from "@/lib/scene/studioEnvironment";

const debug = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug");
const Stats = lazy(() => import("@react-three/drei/core/Stats").then((m) => ({ default: m.Stats })));

/**
 * Night studio for red lacquer: a large soft top light, two long strips that slide across the bevel as the button turns, a cool
 * AIR-blue bounce from below-left and a violet kicker behind, so the edges pick up the brand colours without any neon.
 */
const nightLights: StudioLight[] = [
  { geometry: new PlaneGeometry(), intensity: 3.2, position: [0, 4, 1.5], scale: [6, 3, 1] },
  { geometry: new PlaneGeometry(), intensity: 4, position: [-3.2, 0.8, 1.2], scale: [0.5, 5, 1] },
  { geometry: new PlaneGeometry(), intensity: 2.6, position: [3.2, 1.2, 1.6], scale: [0.35, 5, 1] },
  { geometry: new PlaneGeometry(), intensity: 1.1, color: "#FFF1E6", position: [0, 0.5, 4.5], scale: [7, 2.5, 1] },
  { geometry: new PlaneGeometry(), intensity: 1.6, color: "#2E59E7", position: [-2.5, -3, 1.5], scale: [5, 2, 1] },
  { geometry: new PlaneGeometry(), intensity: 1.4, color: "#7C3AED", position: [2.5, 0.5, -3.5], scale: [4, 4, 1] },
];

function Studio() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const env = createStudioEnvironment(gl, { room: "#141A2E", lights: nightLights });
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
    };
  }, [gl, scene]);
  return null;
}

export default function YtExperience({ onReady, onLost }: { onReady: () => void; onLost: () => void }) {
  const quality = useQuality();

  return (
    <Canvas
      frameloop="demand"
      dpr={quality === "high" ? [1, 2] : [1, 1.5]}
      camera={{ position: [0, 0, 4.2], fov: 30, near: 0.1, far: 20 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl, invalidate }) => {
        gl.domElement.style.touchAction = "pan-y";
        requestAnimationFrame(onReady);
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
      <YtScrollTimeline />
      <Studio />
      <PlayButton />
      {debug && (
        <Suspense fallback={null}>
          <Stats />
        </Suspense>
      )}
    </Canvas>
  );
}
