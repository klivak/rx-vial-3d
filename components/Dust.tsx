"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { AdditiveBlending, BufferAttribute, BufferGeometry, Points, ShaderMaterial } from "three";
import { useQuality } from "@/lib/quality";
import { sceneState } from "@/lib/sceneState";

const VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uScale;
  attribute float aSeed;
  varying float vAlpha;
  void main() {
    // Each mote drifts on its own slow loop; all motion lives here, the CPU only advances uTime.
    vec3 p = position;
    float t = uTime * (0.05 + aSeed * 0.05) + aSeed * 40.0;
    float h = fract(t * 0.018 + aSeed);
    p.x += sin(t * 1.3) * 0.012;
    p.y += h * 0.08 - 0.02;
    p.z += cos(t) * 0.012;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    // Clamped: a mote drifting right past the lens must stay a speck, not a blob over the product.
    gl_PointSize = min(uScale * (0.4 + aSeed * 0.6) / -mv.z, uScale * 2.5);
    // Fade in at the bottom of the loop and out at the top, so motes never pop.
    vAlpha = smoothstep(0.0, 0.15, h) * (1.0 - smoothstep(0.75, 1.0, h));
  }
`;

const FRAGMENT = /* glsl */ `
  uniform float uOpacity;
  varying float vAlpha;
  void main() {
    float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));
    gl_FragColor = vec4(1.0, 0.93, 0.82, a * vAlpha * uOpacity);
  }
`;

/** Dust motes catching the softbox light: one draw call, positions animated on the GPU. */
export function Dust() {
  const quality = useQuality();
  const count = quality === "high" ? 160 : 70;

  const points = useMemo(() => {
    const geometry = new BufferGeometry();
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    let s = 3;
    const rand = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rand() - 0.4) * 0.32;
      pos[i * 3 + 1] = rand() * 0.14;
      pos[i * 3 + 2] = (rand() - 0.6) * 0.3;
      seed[i] = rand();
    }
    geometry.setAttribute("position", new BufferAttribute(pos, 3));
    geometry.setAttribute("aSeed", new BufferAttribute(seed, 1));
    const material = new ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      uniforms: { uTime: { value: 0 }, uScale: { value: 1 }, uOpacity: { value: 0.5 } },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    const p = new Points(geometry, material);
    p.frustumCulled = false;
    return p;
  }, [count]);

  useEffect(
    () => () => {
      points.geometry.dispose();
      (points.material as ShaderMaterial).dispose();
    },
    [points],
  );

  useFrame(({ clock, size, viewport }) => {
    const u = (points.material as ShaderMaterial).uniforms;
    u.uTime.value = clock.elapsedTime;
    // Point size in pixels at 1 m, so motes keep their look across screen sizes and pixel ratios.
    u.uScale.value = size.height * viewport.dpr * 0.0035;
    // A touch brighter on the dim final frame, where the vignette deepens.
    u.uOpacity.value = 0.3 + sceneState.bgTone * 0.2;
  });

  return <primitive object={points} />;
}
