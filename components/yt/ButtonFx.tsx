"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  DoubleSide,
  EllipseCurve,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineLoop,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  RingGeometry,
  ShaderMaterial,
  SphereGeometry,
  Vector2,
  Vector3,
} from "three";
import { ytCopy } from "@/lib/yt/copy";
import { beatAt } from "@/lib/yt/heartbeat";
import { ytState } from "@/lib/yt/state";

/** Reused every frame for the light's position on its orbit. */
const point = new Vector2();

const RINGS = [
  { rx: 1.25, ry: 1.25, tiltX: -1.18, tiltZ: 0.32, speed: 0.55, color: "#6E8BFF" },
  { rx: 1.45, ry: 1.45, tiltX: -1.3, tiltZ: -0.42, speed: -0.38, color: "#A78BFA" },
];

/**
 * Tools screen: two tilted orbits around the button, each with a light running along it, echoing the tool cards that circle the
 * button in the page. Tilted back, so the lower half passes in front of the button and the upper half behind it (depth-tested). Fades in with the frame's `orbit`. Lives in the button's root group, so it does not tilt with the pointer.
 */
export function OrbitRings() {
  const rings = useMemo(
    () =>
      RINGS.map((r) => {
        const curve = new EllipseCurve(0, 0, r.rx, r.ry, 0, Math.PI * 2, false, 0);
        const points = curve.getPoints(96).map((p) => new Vector3(p.x, p.y, 0));
        const line = new LineLoop(
          new BufferGeometry().setFromPoints(points),
          new LineBasicMaterial({ color: r.color, transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending }),
        );
        const light = new Mesh(
          new SphereGeometry(0.035, 12, 12),
          new MeshBasicMaterial({ color: "#FFFFFF", transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending }),
        );
        const halo = new Mesh(
          new SphereGeometry(0.09, 12, 12),
          new MeshBasicMaterial({ color: r.color, transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending }),
        );
        const group = new Group();
        group.rotation.set(r.tiltX, 0, r.tiltZ);
        group.add(line, light, halo);
        return { group, line, light, halo, curve, ...r };
      }),
    [],
  );

  useEffect(
    () => () =>
      rings.forEach((r) => {
        r.line.geometry.dispose();
        (r.line.material as LineBasicMaterial).dispose();
        r.light.geometry.dispose();
        (r.light.material as MeshBasicMaterial).dispose();
        r.halo.geometry.dispose();
        (r.halo.material as MeshBasicMaterial).dispose();
      }),
    [rings],
  );

  useFrame(({ clock }) => {
    const amount = ytState.orbit;
    const t = clock.elapsedTime;
    rings.forEach((r, i) => {
      r.group.visible = amount > 0.01;
      if (!r.group.visible) return;
      (r.line.material as LineBasicMaterial).opacity = 0.35 * amount;
      const p = r.curve.getPoint((((t * r.speed) / (Math.PI * 2) + i * 0.5) % 1 + 1) % 1, point);
      r.light.position.set(p.x, p.y, 0);
      r.halo.position.copy(r.light.position);
      (r.light.material as MeshBasicMaterial).opacity = amount;
      (r.halo.material as MeshBasicMaterial).opacity = 0.35 * amount;
    });
  });

  return (
    <>
      {rings.map((r, i) => (
        <primitive key={i} object={r.group} />
      ))}
    </>
  );
}

const SCORE_R = 0.94;
const SCORE_W = 0.045;
const SCORE_SEGMENTS = 160;

/** How far round the score ring has drawn, 0..score/100: the report scroll eased in and out. The button reads it to follow the head. */
export function scoreArc() {
  const draw = Math.min(1, Math.max(0, ytState.scoreDraw));
  return (ytCopy.report.score / 100) * draw * draw * (3 - 2 * draw);
}

/** The ring head's slow breath once drawn, 0.5..1; the button's triangle glows with it. */
export const scoreBreath = (t: number) => 0.75 + 0.25 * Math.sin(t * 2.2);

/**
 * Report screen: the sample report's score ring, drawn around the button. A faint full track, and an arc in the report's blue to
 * violet that runs clockwise from the top up to the sample score while the report screen scrolls by, with a glowing head at its tip.
 * Lives in the button's root group, so it stays flat to the viewer while the button turns.
 */
export function ScoreRing() {
  const parts = useMemo(() => {
    const track = new Mesh(
      new RingGeometry(SCORE_R - SCORE_W / 2, SCORE_R + SCORE_W / 2, 96),
      new MeshBasicMaterial({ color: "#8FA8FF", transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending }),
    );
    // Starts at the top; mirrored on x so it runs clockwise, like the ring in the report card.
    const arcGeometry = new RingGeometry(SCORE_R - SCORE_W / 2, SCORE_R + SCORE_W / 2, SCORE_SEGMENTS, 1, Math.PI / 2, Math.PI * 2);
    const from = new Color("#2E59E7");
    const to = new Color("#7C3AED");
    const c = new Color();
    const colors: number[] = [];
    const pos = arcGeometry.getAttribute("position");
    for (let i = 0; i < pos.count; i++) {
      // Clockwise angle from the top once mirrored, 0..1, for the gradient.
      const a = (Math.atan2(-pos.getX(i), pos.getY(i)) / (Math.PI * 2) + 1) % 1;
      c.copy(from).lerp(to, a);
      colors.push(c.r, c.g, c.b);
    }
    arcGeometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
    const arc = new Mesh(
      arcGeometry,
      new MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, depthWrite: false, side: DoubleSide, blending: AdditiveBlending }),
    );
    arc.scale.x = -1;
    const head = new Mesh(
      new SphereGeometry(0.05, 12, 12),
      new MeshBasicMaterial({ color: "#FFFFFF", transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending }),
    );
    const halo = new Mesh(
      new SphereGeometry(0.1, 12, 12),
      new MeshBasicMaterial({ color: "#7C3AED", transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending }),
    );
    const group = new Group();
    group.add(track, arc, halo, head);
    return { group, track, arc, head, halo };
  }, []);

  useEffect(
    () => () =>
      [parts.track, parts.arc, parts.head, parts.halo].forEach((m) => {
        m.geometry.dispose();
        (m.material as MeshBasicMaterial).dispose();
      }),
    [parts],
  );

  useFrame(({ clock }) => {
    const amount = ytState.score;
    parts.group.visible = amount > 0.01;
    if (!parts.group.visible) return;
    const fade = Math.min(1, amount * 3);
    const progress = scoreArc();
    parts.arc.geometry.setDrawRange(0, 6 * Math.round(progress * SCORE_SEGMENTS));
    (parts.track.material as MeshBasicMaterial).opacity = 0.1 * fade;
    (parts.arc.material as MeshBasicMaterial).opacity = 0.95 * fade;
    const a = progress * Math.PI * 2;
    parts.head.position.set(Math.sin(a) * SCORE_R, Math.cos(a) * SCORE_R, 0.01);
    parts.halo.position.copy(parts.head.position);
    // The head breathes slowly once the ring has drawn, so the score feels live.
    const breath = scoreBreath(clock.elapsedTime);
    (parts.head.material as MeshBasicMaterial).opacity = fade;
    (parts.halo.material as MeshBasicMaterial).opacity = 0.45 * fade * breath;
    parts.halo.scale.setScalar(0.85 + 0.3 * breath);
  });

  return <primitive object={parts.group} />;
}

const RADAR_R = 1.75;

/** Rival channels on the radar: position in the radar's -1..1 square and size. */
const BLIPS = [
  [0.62, 0.38, 1],
  [-0.48, 0.66, 0.8],
  [-0.78, -0.22, 1.1],
  [0.3, -0.74, 0.9],
  [0.86, -0.3, 0.7],
  [-0.12, 0.9, 0.75],
];

const RADAR_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const RADAR_FRAGMENT = /* glsl */ `
  #define TAU 6.28318530718
  uniform float uTime;
  uniform float uAmount;
  uniform vec3 uColor;
  uniform vec3 uBlips[${BLIPS.length}];
  varying vec2 vUv;
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    if (r > 1.0) discard;
    float edge = 1.0 - smoothstep(0.8, 1.0, r);
    // Clockwise sweep; behind = how far (in radians) the beam has moved past this point.
    float sweep = -uTime * 1.1;
    float behind = mod(atan(p.y, p.x) - sweep, TAU);
    float trail = exp(-behind * 2.0) * smoothstep(0.2, 0.45, r) * edge;
    float beam = smoothstep(0.045, 0.0, behind) * smoothstep(0.2, 0.5, r) * edge;
    float rings = 0.0;
    for (int i = 1; i <= 3; i++) rings += smoothstep(0.009, 0.0, abs(r - 0.4 - float(i) * 0.19));
    rings *= edge;
    // Rivals flash as the beam crosses them and fade until the next pass.
    float blips = 0.0;
    for (int i = 0; i < ${BLIPS.length}; i++) {
      vec3 b = uBlips[i];
      float d = length(p - b.xy);
      float lit = exp(-mod(atan(b.y, b.x) - sweep, TAU) * 1.3);
      blips += smoothstep(0.035 * b.z, 0.0, d) * (0.35 + 0.65 * lit) + smoothstep(0.13 * b.z, 0.0, d) * lit * 0.5;
    }
    float glow = rings * 0.45 + trail * 0.4 + beam * 0.9;
    vec3 color = uColor * glow + mix(uColor, vec3(1.0), 0.6) * blips;
    gl_FragColor = vec4(color, max(glow, blips) * uAmount);
  }
`;

/**
 * Competitors screen: a radar behind the button. Faint range rings, a beam sweeping clockwise with a fading trail, and a few
 * rival channels that flash as the beam passes, so the button reads as "you" in the middle of your niche. One shader quad.
 */
export function Radar() {
  const mesh = useMemo(() => {
    const material = new ShaderMaterial({
      vertexShader: RADAR_VERTEX,
      fragmentShader: RADAR_FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uAmount: { value: 0 },
        uColor: { value: new Color("#8FA8FF") },
        uBlips: { value: BLIPS.map(([x, y, z]) => new Vector3(x, y, z)) },
      },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    const m = new Mesh(new PlaneGeometry(RADAR_R * 2, RADAR_R * 2), material);
    m.position.z = -0.35;
    m.visible = false;
    return m;
  }, []);

  useEffect(
    () => () => {
      mesh.geometry.dispose();
      (mesh.material as ShaderMaterial).dispose();
    },
    [mesh],
  );

  useFrame(({ clock }) => {
    const amount = ytState.radar;
    mesh.visible = amount > 0.01;
    if (!mesh.visible) return;
    const u = (mesh.material as ShaderMaterial).uniforms;
    u.uTime.value = clock.elapsedTime;
    u.uAmount.value = amount;
  });

  return <primitive object={mesh} />;
}

const WAVES_SIZE = 4.4;

const WAVES_FRAGMENT = /* glsl */ `
  uniform float uAge;
  uniform vec3 uColor;
  varying vec2 vUv;
  // Distance to the button's silhouette: a rounded box the size of the body (half extents in button units).
  float silhouette(vec2 p) {
    vec2 q = abs(p) - vec2(0.714, 0.5) + 0.2;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - 0.2;
  }
  // One wave of the beat: a contour that runs out from the edge, breaks into arcs and fades.
  float wave(float d, float a, float start, float seed) {
    float w = (uAge - start) / 0.7;
    if (w <= 0.0 || w >= 1.0) return 0.0;
    float front = 0.03 + (1.0 - pow(1.0 - w, 3.0)) * 1.25;
    float width = 0.018 + 0.05 * w;
    float line = exp(-pow((d - front) / width, 2.0));
    float wake = smoothstep(front, 0.0, d) * exp(-d * 2.5) * 0.18;
    float arcs = 0.5 + 0.5 * (0.6 * sin(a * 5.0 + seed) + 0.4 * sin(a * 11.0 - seed * 1.7));
    float broken = mix(1.0, smoothstep(0.3, 0.6, arcs), w);
    return (line * broken + wake) * pow(1.0 - w, 2.0);
  }
  void main() {
    vec2 p = (vUv - 0.5) * ${WAVES_SIZE.toFixed(2)};
    float d = silhouette(p);
    if (d < 0.0) discard;
    float a = atan(p.y, p.x);
    // "Lub-dub": a strong wave and a weaker one right behind it.
    float waves = wave(d, a, 0.0, 1.3) + 0.55 * wave(d, a, 0.17, 4.1);
    // A brief red glow hugs the edge with each beat, with a few short rays torn out of it.
    float flash = exp(-uAge * 6.0) + 0.5 * exp(-max(uAge - 0.17, 0.0) * 8.0) * step(0.17, uAge);
    float rays = pow(0.5 + 0.5 * sin(a * 9.0 + 2.0) * sin(a * 4.0 - 1.0), 6.0);
    float glow = flash * (exp(-d * 9.0) * 0.55 + rays * exp(-d * 3.5) * 0.35);
    float v = waves + glow;
    vec3 color = mix(uColor, vec3(1.0, 0.85, 0.88), clamp(waves - 0.6, 0.0, 1.0));
    gl_FragColor = vec4(color * v, v);
  }
`;

/**
 * Pains screen: each pain that lights up sends a weak heartbeat out of the grey button. The button itself stays still; around it a
 * red contour runs out from the edge twice ("lub-dub"), breaking into arcs as it fades, with a short red glow on the rim. One shader quad.
 */
export function PainWaves() {
  const mesh = useMemo(() => {
    const material = new ShaderMaterial({
      vertexShader: RADAR_VERTEX,
      fragmentShader: WAVES_FRAGMENT,
      uniforms: { uAge: { value: 0 }, uColor: { value: new Color("#FF2A4F") } },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    const m = new Mesh(new PlaneGeometry(WAVES_SIZE, WAVES_SIZE), material);
    m.position.z = -0.2;
    m.visible = false;
    return m;
  }, []);

  useEffect(
    () => () => {
      mesh.geometry.dispose();
      (mesh.material as ShaderMaterial).dispose();
    },
    [mesh],
  );

  useFrame(({ invalidate }) => {
    const age = beatAt(performance.now());
    mesh.visible = age >= 0;
    if (!mesh.visible) return;
    (mesh.material as ShaderMaterial).uniforms.uAge.value = age;
    invalidate();
  });

  return <primitive object={mesh} />;
}
