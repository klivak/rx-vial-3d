"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  DodecahedronGeometry,
  DoubleSide,
  EllipseCurve,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineLoop,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  RingGeometry,
  ShaderMaterial,
  SphereGeometry,
  Vector2,
  Vector3,
} from "three";
import { playButtonColors } from "@/lib/yt/buildPlayButton";
import { ytCopy } from "@/lib/yt/copy";
import { beatAt } from "@/lib/yt/heartbeat";
import { ytFx, ytState } from "@/lib/yt/state";

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
const TRACK_SEGMENTS = 96;

/** 0 below `from`, 1 above `to`, eased in between. */
const smooth = (from: number, to: number, v: number) => {
  const x = Math.min(1, Math.max(0, (v - from) / (to - from)));
  return x * x * (3 - 2 * x);
};

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
    // Both the track and the arc start at the top; mirrored on x so they run clockwise, like the ring in the report card.
    const track = new Mesh(
      new RingGeometry(SCORE_R - SCORE_W / 2, SCORE_R + SCORE_W / 2, TRACK_SEGMENTS, 1, Math.PI / 2, Math.PI * 2),
      new MeshBasicMaterial({ color: "#8FA8FF", transparent: true, opacity: 0, depthWrite: false, side: DoubleSide, blending: AdditiveBlending }),
    );
    track.scale.x = -1;
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
    // Staged on the way in, so nothing pops while the button is still flying over: the track draws itself round from the top,
    // then the head drops onto the top, and only then does the arc fill (scoreArc). Scrolling back plays it in reverse.
    const trackDraw = smooth(0.35, 0.8, amount);
    const pop = smooth(0.72, 1, amount);
    parts.group.visible = trackDraw > 0;
    if (!parts.group.visible) return;
    parts.track.geometry.setDrawRange(0, 6 * Math.round(trackDraw * TRACK_SEGMENTS));
    // Brighter while it draws, so the stroke reads as a moving line, then settles to a faint track.
    (parts.track.material as MeshBasicMaterial).opacity = 0.1 + 0.3 * Math.sin(Math.PI * trackDraw);
    const progress = scoreArc();
    parts.arc.geometry.setDrawRange(0, 6 * Math.round(progress * SCORE_SEGMENTS));
    (parts.arc.material as MeshBasicMaterial).opacity = 0.95 * pop;
    const a = progress * Math.PI * 2;
    parts.head.position.set(Math.sin(a) * SCORE_R, Math.cos(a) * SCORE_R, 0.01);
    parts.halo.position.copy(parts.head.position);
    // The head pops in with a small overshoot, then breathes slowly once the ring has drawn, so the score feels live.
    const breath = scoreBreath(clock.elapsedTime);
    const popScale = pop * (1 + 0.6 * Math.sin(Math.PI * pop));
    parts.head.scale.setScalar(popScale);
    (parts.head.material as MeshBasicMaterial).opacity = pop;
    (parts.halo.material as MeshBasicMaterial).opacity = 0.45 * pop * breath;
    parts.halo.scale.setScalar(popScale * (0.85 + 0.3 * breath));
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

const CHIPS = 28;
const CHIPS_PER_HIT = 7;
const CHIP_LIFE = 1.5;
const GRAVITY = 3.2;

type Chip = { mesh: Mesh; born: number; vx: number; vy: number; x: number; y: number; z: number; spin: Vector3; size: number };

/** A point on the button's rim (half extents 0.714 x 0.5), biased towards the cracked upper left where the hits land. */
function rimPoint(out: Vector2) {
  const a = Math.random() < 0.6 ? Math.PI * (0.55 + Math.random() * 0.6) : Math.random() * Math.PI * 2;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const k = 1 / Math.max(Math.abs(c) / 0.7, Math.abs(s) / 0.48);
  return out.set(c * k, s * k);
}

/**
 * Pains screen: every pain that lights up hits the grey button. Small chips break off its rim, tumble and fall away under gravity,
 * fading as they go. Lives in the button's root group, so they fall straight down whatever the button's turn.
 */
export function Debris() {
  const parts = useMemo(() => {
    const geometry = new DodecahedronGeometry(0.045, 0);
    // Flattened and skewed, so the pieces read as flakes of lacquer rather than pebbles.
    geometry.scale(1.3, 0.75, 0.4);
    const chips: Chip[] = Array.from({ length: CHIPS }, () => {
      const mesh = new Mesh(
        geometry,
        new MeshStandardMaterial({ color: playButtonColors.redDim, roughness: 0.45, metalness: 0.1, transparent: true, opacity: 0 }),
      );
      mesh.visible = false;
      return { mesh, born: -Infinity, vx: 0, vy: 0, x: 0, y: 0, z: 0, spin: new Vector3(), size: 1 };
    });
    const group = new Group();
    chips.forEach((c) => group.add(c.mesh));
    return { group, geometry, chips, seen: -1, next: 0 };
  }, []);

  useEffect(
    () => () => {
      parts.geometry.dispose();
      parts.chips.forEach((c) => (c.mesh.material as MeshStandardMaterial).dispose());
    },
    [parts],
  );

  useFrame(({ clock, invalidate }) => {
    const t = clock.elapsedTime;
    // A new hit: break a handful of chips off the rim.
    if (ytFx.beatAt !== parts.seen) {
      parts.seen = ytFx.beatAt;
      if (beatAt(performance.now()) >= 0)
        for (let n = 0; n < CHIPS_PER_HIT; n++) {
          const c = parts.chips[parts.next];
          parts.next = (parts.next + 1) % CHIPS;
          rimPoint(point);
          c.born = t + n * 0.03;
          c.x = point.x;
          c.y = point.y;
          c.z = 0.05 + Math.random() * 0.1;
          c.vx = point.x * (0.5 + Math.random() * 0.6);
          c.vy = 0.5 + Math.random() * 0.7;
          c.spin.set(Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 8 - 4);
          c.size = 0.5 + Math.random() * 0.9;
          c.mesh.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
        }
    }
    let alive = false;
    parts.chips.forEach((c) => {
      const age = t - c.born;
      const live = age >= 0 && age < CHIP_LIFE;
      c.mesh.visible = live;
      if (!live) return;
      alive = true;
      c.mesh.position.set(c.x + c.vx * age, c.y + c.vy * age - 0.5 * GRAVITY * age * age, c.z + age * 0.2);
      c.mesh.rotation.x += c.spin.x * 0.016;
      c.mesh.rotation.y += c.spin.y * 0.016;
      c.mesh.rotation.z += c.spin.z * 0.016;
      c.mesh.scale.setScalar(c.size * (age < 0.08 ? age / 0.08 : 1));
      (c.mesh.material as MeshStandardMaterial).opacity = Math.min(1, (1 - age / CHIP_LIFE) * 2.5);
    });
    if (alive) invalidate();
  });

  return <primitive object={parts.group} />;
}
