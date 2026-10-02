"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, Points, ShaderMaterial } from "three";
import { ytState } from "@/lib/yt/state";

const COUNT = 46;

const VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uScale;
  attribute float aSeed;
  varying float vTwinkle;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    // Each glint flashes briefly on its own rhythm; most of the time it is off.
    float wave = sin(uTime * (1.2 + aSeed * 1.8) + aSeed * 40.0);
    vTwinkle = pow(max(wave, 0.0), 10.0);
    gl_PointSize = uScale * (0.6 + aSeed * 0.8) * (0.4 + vTwinkle) / -mv.z;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform float uAmount;
  uniform vec3 uColor;
  varying float vTwinkle;
  void main() {
    // Four-point star: a bright core plus two thin crossing rays.
    vec2 p = gl_PointCoord - 0.5;
    float core = smoothstep(0.18, 0.0, length(p));
    float rays = smoothstep(0.035, 0.0, abs(p.x)) * smoothstep(0.5, 0.0, abs(p.y))
      + smoothstep(0.035, 0.0, abs(p.y)) * smoothstep(0.5, 0.0, abs(p.x));
    gl_FragColor = vec4(uColor, (core + rays * 0.7) * vTwinkle * uAmount);
  }
`;

const silver = new Color(0.92, 0.95, 1);
const gold = new Color(1, 0.78, 0.3);
const diamond = new Color(0.62, 0.84, 1);

/** Star glints around the button once it turns into an award: one draw call, the twinkle runs on the GPU. */
export function Sparkles() {
  const points = useMemo(() => {
    const geometry = new BufferGeometry();
    const pos = new Float32Array(COUNT * 3);
    const seed = new Float32Array(COUNT);
    let s = 11;
    const rand = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < COUNT; i++) {
      // On a loose ring around the silhouette, mostly in front of it.
      const a = rand() * Math.PI * 2;
      const r = 0.82 + rand() * 0.35;
      pos[i * 3] = Math.cos(a) * r * 1.05;
      pos[i * 3 + 1] = Math.sin(a) * r * 0.78;
      pos[i * 3 + 2] = (rand() - 0.3) * 0.5;
      seed[i] = rand();
    }
    geometry.setAttribute("position", new BufferAttribute(pos, 3));
    geometry.setAttribute("aSeed", new BufferAttribute(seed, 1));
    const material = new ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      uniforms: { uTime: { value: 0 }, uScale: { value: 1 }, uAmount: { value: 0 }, uColor: { value: new Color() } },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    const p = new Points(geometry, material);
    p.frustumCulled = false;
    return p;
  }, []);

  useEffect(
    () => () => {
      points.geometry.dispose();
      (points.material as ShaderMaterial).dispose();
    },
    [points],
  );

  useFrame(({ clock, size, viewport }) => {
    const u = (points.material as ShaderMaterial).uniforms;
    const t = ytState.tier;
    const amount = Math.min(1, Math.max(0, t - 0.4)) * (1 - ytState.lacquer);
    points.visible = amount > 0.01;
    if (!points.visible) return;
    u.uTime.value = clock.elapsedTime;
    u.uScale.value = size.height * viewport.dpr * 0.09;
    // Diamond glitters harder than the metals.
    u.uAmount.value = amount * (t > 2.5 ? 1.6 : 1);
    // Silver glints are cool, gold warm, diamond icy blue.
    (u.uColor.value as Color).copy(t < 1.5 ? silver : t < 2.5 ? gold : diamond);
  });

  return <primitive object={points} />;
}
