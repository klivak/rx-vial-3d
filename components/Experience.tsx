"use client";

import { AdaptiveDpr, ContactShadows, Environment, Lightformer, PerformanceMonitor, Stats } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useState } from "react";
import { Box } from "@/components/Box";
import { CameraRig } from "@/components/CameraRig";
import { Orbit } from "@/components/Orbit";
import { ScrollTimeline } from "@/components/ScrollTimeline";
import { Vial } from "@/components/Vial";
import { setQuality, useQuality } from "@/lib/quality";
import { BOX } from "@/lib/scene/buildBox";

const debug = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug");

function Studio() {
  // Lightformers render a studio environment on the GPU: zero network requests, unlike an HDRI.
  return (
    <Environment resolution={256} frames={1}>
      <Lightformer form="rect" intensity={2.6} position={[0, 4, 1]} rotation-x={Math.PI / 2} scale={[6, 4, 1]} />
      <Lightformer form="rect" intensity={3} position={[-3, 1, 1]} rotation-y={Math.PI / 2} scale={[0.6, 5, 1]} />
      <Lightformer form="rect" intensity={3} position={[3, 1, 1]} rotation-y={-Math.PI / 2} scale={[0.6, 5, 1]} />
      <Lightformer form="rect" intensity={0.8} position={[0, 1, 4]} scale={[8, 3, 1]} color="#FFE9D2" />
      <Lightformer form="ring" intensity={1.2} position={[1.5, 2, 3]} scale={1.2} />
    </Environment>
  );
}

export default function Experience({ onReady }: { onReady?: () => void }) {
  const quality = useQuality();
  const [orbit, setOrbit] = useState(false);

  return (
    <Canvas
      frameloop="demand"
      dpr={quality === "high" ? [1, 2] : [1, 1.5]}
      camera={{ position: [0, 0.06, 0.42], fov: 30, near: 0.01, far: 10 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={() => {
        requestAnimationFrame(() => onReady?.());
      }}
    >
      <PerformanceMonitor onDecline={() => setQuality("low")} onIncline={() => setQuality("high")} flipflops={3} />
      <AdaptiveDpr pixelated={false} />
      <CameraRig enabled={!orbit} />
      <ScrollTimeline onOrbit={setOrbit} />
      {orbit && <Orbit />}
      <Studio />
      <Vial />
      <Box />
      {/* Vial shadow redraws whenever the demand frameloop renders (so the lift reads); the box never moves on the floor, so its shadow is baked once. */}
      <ContactShadows opacity={0.45} scale={0.14} blur={2.2} far={0.06} resolution={256} color="#3B2A1A" />
      <ContactShadows position={[BOX.position[0], 0, BOX.position[2]]} opacity={0.4} scale={0.2} blur={2.6} far={0.06} resolution={256} frames={2} color="#3B2A1A" />
      {debug && <Stats />}
    </Canvas>
  );
}
