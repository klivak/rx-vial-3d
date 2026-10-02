"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { lazy, Suspense, useEffect, useRef } from "react";
import { PlaneGeometry, type Material, type Mesh, type Texture } from "three";
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

/**
 * Compiles every shader and uploads every texture while the loader is still up, then reports ready. The score ring, radar, scan lines,
 * orbits and sparkles start hidden, so without this their programs compiled on first appearance and froze the page mid-scroll.
 * `compileAsync` walks hidden objects too and uses KHR_parallel_shader_compile where the driver offers it.
 */
function Warmup({ onReady }: { onReady: () => void }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    let alive = true;
    scene.traverse((o) => {
      const mats = (o as Mesh).material;
      if (!mats) return;
      for (const m of Array.isArray(mats) ? mats : [mats]) {
        for (const v of Object.values(m as Material)) if ((v as Texture | null)?.isTexture) gl.initTexture(v as Texture);
      }
    });
    gl.compileAsync(scene, camera)
      .catch(() => {})
      .then(() => {
        if (!alive) return;
        invalidate();
        requestAnimationFrame(onReady);
      });
    return () => {
      alive = false;
    };
    // onReady is a fresh closure on every render of the parent; the warm-up runs once per renderer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, camera, invalidate]);
  return null;
}

/** Frame time (ms) above which the pixel ratio steps down: under ~42 fps sustained. */
const SLOW_FRAME_MS = 24;
const SAMPLE_FRAMES = 180;

/**
 * One-way quality drop for slow devices. drei's PerformanceMonitor counted frames per 250 ms window, which under on-demand
 * rendering reads an idle canvas as "4 fps" and dropped fast machines to the lower pixel ratio (a canvas resize, a visible hitch).
 * This only looks at back-to-back frames once the page is open and visible, and judges the median of a few seconds of them.
 */
function FrameMonitor({ armed }: { armed: boolean }) {
  const samples = useRef<number[]>([]);
  const done = useRef(false);
  useFrame((_, delta) => {
    if (!armed || done.current || document.visibilityState !== "visible") return;
    const ms = delta * 1000;
    // Gaps are idle time between on-demand frames, not slow frames.
    if (ms > 100) return;
    samples.current.push(ms);
    if (samples.current.length < SAMPLE_FRAMES) return;
    const sorted = samples.current.sort((a, b) => a - b);
    done.current = true;
    if (sorted[sorted.length >> 1] > SLOW_FRAME_MS) setQuality("low");
  });
  return null;
}

export default function YtExperience({ onReady, onLost, open }: { onReady: () => void; onLost: () => void; open: boolean }) {
  const quality = useQuality();

  return (
    <Canvas
      className="yt-3d"
      frameloop="demand"
      dpr={quality === "high" ? [1, 2] : [1, 1.5]}
      camera={{ position: [0, 0, 4.2], fov: 30, near: 0.1, far: 20 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl, invalidate }) => {
        gl.domElement.style.touchAction = "pan-y";
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
      {/* One-way: a slow device drops to the lower pixel ratio once and stays there; flipping back and forth resized the canvas and blinked. */}
      <FrameMonitor armed={open} />
      <YtScrollTimeline />
      <Studio />
      <PlayButton />
      <Warmup onReady={onReady} />
      {debug && (
        <Suspense fallback={null}>
          <Stats />
        </Suspense>
      )}
    </Canvas>
  );
}
