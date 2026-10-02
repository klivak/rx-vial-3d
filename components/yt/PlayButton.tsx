"use client";

import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { AdditiveBlending, Color, Group, Mesh, MeshBasicMaterial } from "three";
import { parallax, startParallax } from "@/lib/parallax";
import { useQuality } from "@/lib/quality";
import { buildPlayButton, buildRippleGeometry, PLAY_BUTTON_FRONT_Z, playButtonColors } from "@/lib/yt/buildPlayButton";
import { ytPointer, ytState } from "@/lib/yt/state";

/** Radians the button turns towards the pointer (or the phone's tilt). */
const TILT_Y = 0.32;
const TILT_X = 0.22;
const RIPPLE_SECONDS = 1.1;
const RIPPLES = 2;

const red = new Color(playButtonColors.red);
const dim = new Color(playButtonColors.redDim);
const white = new Color(playButtonColors.triangle);
const whiteDim = new Color("#8E93A3");
const smooth = { x: 0, y: 0 };

/** Cheap deterministic noise: the glitch looks random but replays the same way at the same time. */
const hash = (n: number) => {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
};

/**
 * The hero object. Scroll moves it between frames (ytState); on top of that it floats, turns towards the pointer, sinks in under
 * hover, presses with an outward ring on click, and loses its colour and stutters while the page talks about a stalled channel.
 */
export function PlayButton() {
  const quality = useQuality();
  const button = useMemo(() => buildPlayButton(quality === "high" ? "high" : "low"), [quality]);
  const rippleGeometry = useMemo(() => buildRippleGeometry(), []);
  const ripples = useMemo(
    () =>
      Array.from({ length: RIPPLES }, () => {
        const m = new Mesh(
          rippleGeometry,
          new MeshBasicMaterial({ color: "#FF2A4F", transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending }),
        );
        m.position.z = PLAY_BUTTON_FRONT_Z - 0.02;
        m.visible = false;
        return m;
      }),
    [rippleGeometry],
  );
  const clock = useThree((st) => st.clock);
  const invalidate = useThree((st) => st.invalidate);
  const root = useRef<Group>(null);
  const tilt = useRef<Group>(null);
  const press = useRef<Group>(null);

  useEffect(() => startParallax(), []);
  useEffect(() => () => button.dispose(), [button]);
  useEffect(
    () => () => {
      rippleGeometry.dispose();
      ripples.forEach((r) => (r.material as MeshBasicMaterial).dispose());
    },
    [rippleGeometry, ripples],
  );

  useFrame(({ clock, viewport, camera, invalidate }, delta) => {
    if (!root.current || !tilt.current || !press.current) return;
    const s = ytState;
    const t = clock.elapsedTime;
    const vp = viewport.getCurrentViewport(camera, [0, 0, 0]);

    // Pointer follow with a soft lag.
    const k = 1 - Math.exp(-delta * 4);
    smooth.x += (parallax.x - smooth.x) * k;
    smooth.y += (parallax.y - smooth.y) * k;

    // Hover eases in and out; a press snaps in and recovers on an exponential.
    const p = ytPointer;
    p.hover += (p.hoverTarget - p.hover) * (1 - Math.exp(-delta * 10));
    p.press *= Math.exp(-delta * 5);
    if (p.press < 1e-3) p.press = 0;

    // Glitch bursts while the channel is "sick": a few frames of offset and a flash of the old red, a couple of times a second.
    const sick = 1 - s.health;
    const slot = Math.floor(t * 2.3);
    const glitch = sick > 0.4 && s.idle > 0 && hash(slot) > 0.6 && t * 2.3 - slot < 0.16 ? sick : 0;
    const jitterX = glitch ? (hash(t * 60) - 0.5) * 0.05 : 0;
    const jitterZ = glitch ? (hash(t * 47 + 3) - 0.5) * 0.12 : 0;

    const size = s.scale * vp.height;
    root.current.position.set(
      (s.x * vp.width) / 2 + jitterX,
      (s.y * vp.height) / 2 + Math.sin(t * 0.9) * 0.025 * s.idle * size,
      0,
    );
    root.current.scale.setScalar(size * (1 + p.hover * 0.04 - p.press * 0.06));

    tilt.current.rotation.set(
      s.rotX + smooth.y * TILT_X + Math.sin(t * 0.7) * 0.035 * s.idle,
      s.rotY + smooth.x * TILT_Y + Math.sin(t * 0.5) * 0.09 * s.idle,
      s.rotZ + Math.sin(t * 0.43) * 0.02 * s.idle + jitterZ,
    );
    press.current.scale.z = 1 - p.hover * 0.12 - p.press * 0.3;

    const health = glitch ? Math.max(s.health, 0.55) : s.health;
    button.bodyMaterial.color.copy(dim).lerp(red, health);
    button.bodyMaterial.roughness = 0.62 - 0.3 * health;
    button.bodyMaterial.clearcoat = 0.25 + 0.75 * health;
    button.triangleMaterial.color.copy(whiteDim).lerp(white, health);
    // A little self-light keeps the triangle reading as white against the lacquer even when it faces away from the softbox.
    button.triangleMaterial.emissiveIntensity = (0.22 + p.hover * 0.2 + p.press * 0.5) * health;

    // Rings run outwards from the silhouette after a click, the second one a beat behind the first.
    let ringsLive = false;
    ripples.forEach((ring, i) => {
      const age = p.rippleAt < 0 ? -1 : (t - p.rippleAt - i * 0.18) / RIPPLE_SECONDS;
      const live = age >= 0 && age < 1;
      ring.visible = live;
      if (!live) return;
      ringsLive = true;
      const e = 1 - Math.pow(1 - age, 3);
      ring.scale.setScalar(1 + e * (0.9 + i * 0.35));
      (ring.material as MeshBasicMaterial).opacity = (1 - age) * (1 - age) * (0.85 - i * 0.3);
    });

    // Demand frameloop: keep drawing while anything is alive; otherwise the GPU rests until the next scroll update.
    const settling = Math.abs(parallax.x - smooth.x) + Math.abs(parallax.y - smooth.y) > 1e-3 || Math.abs(p.hoverTarget - p.hover) > 1e-3;
    if (s.idle > 0 || p.press > 0 || ringsLive || settling) invalidate();
  });

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    ytPointer.hoverTarget = 1;
    document.body.style.cursor = "pointer";
    invalidate();
  };
  const out = () => {
    ytPointer.hoverTarget = 0;
    document.body.style.cursor = "";
    invalidate();
  };
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    ytPointer.press = 1;
    ytPointer.rippleAt = clock.elapsedTime;
    invalidate();
  };

  return (
    <group ref={root}>
      <group ref={tilt}>
        <group ref={press} onPointerOver={over} onPointerOut={out} onClick={click}>
          <primitive object={button.group} />
        </group>
        {ripples.map((r, i) => (
          <primitive key={i} object={r} />
        ))}
      </group>
    </group>
  );
}
