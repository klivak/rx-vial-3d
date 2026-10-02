"use client";

import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { AdditiveBlending, CanvasTexture, Color, Group, Mesh, MeshBasicMaterial, PlaneGeometry } from "three";
import { parallax, startParallax } from "@/lib/parallax";
import { getQuality } from "@/lib/quality";
import { buildPlayButton, buildRippleGeometry, PLAY_BUTTON_FRONT_Z } from "@/lib/yt/buildPlayButton";
import { OrbitRings, PainWaves, Radar, ScoreRing } from "@/components/yt/ButtonFx";
import { Sparkles } from "@/components/yt/Sparkles";
import { AUDIT_URL } from "@/lib/yt/copy";
import { applyFinish } from "@/lib/yt/finishes";
import { buttonMaxHeight, columnShare } from "@/lib/yt/layout";
import { ytIntro, ytPointer, ytState } from "@/lib/yt/state";

/** Radians the button turns towards the pointer (or the phone's tilt). */
const TILT_Y = 0.32;
const TILT_X = 0.22;
const RIPPLE_SECONDS = 1.1;
const RIPPLES = 2;

const whiteDim = new Color("#8E93A3");
const triangleTint = new Color();
const smooth = { x: 0, y: 0 };
/** Seconds between the rings the button sends out on its own while the tools orbit it. */
const ORBIT_PULSE = 2.4;
let lastPulse = -Infinity;
/** Spread and brightness of the next ring: full for a click or an orbit pulse, softer for the landing after the loader. */
let rippleGain = 1;
/** Entrance after the loader: the button rises and swings in grey, the red pours in, and it lands with a ring. */
const INTRO_MS = 1800;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const easeOutBack = (x: number) => 1 + 2.4 * Math.pow(x - 1, 3) + 1.4 * Math.pow(x - 1, 2);

/** Soft streak for the scan line: bright in the middle, fading to nothing at the sides and towards the ends. */
function streakTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const across = ctx.createLinearGradient(0, 0, 64, 0);
  across.addColorStop(0, "rgba(255,255,255,0)");
  across.addColorStop(0.5, "rgba(255,255,255,1)");
  across.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = across;
  ctx.fillRect(0, 0, 64, 128);
  ctx.globalCompositeOperation = "destination-in";
  const along = ctx.createLinearGradient(0, 0, 0, 128);
  along.addColorStop(0, "rgba(0,0,0,0)");
  along.addColorStop(0.2, "rgba(0,0,0,1)");
  along.addColorStop(0.8, "rgba(0,0,0,1)");
  along.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = along;
  ctx.fillRect(0, 0, 64, 128);
  return new CanvasTexture(canvas);
}


/**
 * The hero object. Scroll moves it between frames (ytState); on top of that it floats, turns towards the pointer, sinks in under
 * hover, presses with an outward ring on click, drains and refills like a glass of liquid, and turns into silver, gold and diamond.
 */
export function PlayButton() {
  // Built once at the starting tier: rebuilding on a runtime quality change swapped the meshes mid-animation and flashed.
  const button = useMemo(() => buildPlayButton(getQuality() === "high" ? "high" : "low"), []);
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
  // Scan line: a bright core and a wide soft halo, swept across the face while the audit "reads" the channel.
  const streak = useMemo(() => streakTexture(), []);
  const scanLines = useMemo(
    () =>
      [
        [0.05, 1],
        [0.4, 0.35],
      ].map(([width, strength]) => {
        const m = new Mesh(
          new PlaneGeometry(width, 1.1),
          new MeshBasicMaterial({ color: "#8FA8FF", map: streak, transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending }),
        );
        m.position.z = PLAY_BUTTON_FRONT_Z + 0.06;
        m.userData.strength = strength;
        m.visible = false;
        return m;
      }),
    [streak],
  );
  // Plating band: a warm or cool light that crosses the face while the button changes from one award metal to the next.
  const platingLines = useMemo(
    () =>
      [
        [0.12, 1],
        [0.7, 0.45],
      ].map(([width, strength]) => {
        const m = new Mesh(
          new PlaneGeometry(width, 1.15),
          new MeshBasicMaterial({ map: streak, transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending }),
        );
        m.position.z = PLAY_BUTTON_FRONT_Z + 0.07;
        m.rotation.z = -0.35;
        m.userData.strength = strength;
        m.visible = false;
        return m;
      }),
    [streak],
  );
  const clock = useThree((st) => st.clock);
  const invalidate = useThree((st) => st.invalidate);
  const root = useRef<Group>(null);
  const tilt = useRef<Group>(null);
  const press = useRef<Group>(null);

  // Mouse only: phone gyroscope noise made the button shiver.
  useEffect(() => startParallax({ tilt: false }), []);
  useEffect(() => () => button.dispose(), [button]);
  useEffect(() => {
    ytIntro.wake = invalidate;
    return () => {
      ytIntro.wake = () => {};
    };
  }, [invalidate]);
  useEffect(
    () => () => {
      rippleGeometry.dispose();
      ripples.forEach((r) => (r.material as MeshBasicMaterial).dispose());
      scanLines.forEach((l) => {
        l.geometry.dispose();
        (l.material as MeshBasicMaterial).dispose();
      });
      platingLines.forEach((l) => {
        l.geometry.dispose();
        (l.material as MeshBasicMaterial).dispose();
      });
      streak.dispose();
    },
    [rippleGeometry, ripples, scanLines, platingLines, streak],
  );

  useFrame(({ clock, viewport, camera, invalidate, size: screen }, delta) => {
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

    // Frame scale is a share of the screen height, capped by the column width so narrow laptops get a smaller button. The cap is
    // tighter while the score ring shows, so the ring around the button stays clear of the report card in the right column.
    const size = Math.min(s.scale * vp.height, buttonMaxHeight(screen.width) * (1 - 0.22 * s.score) * (vp.height / screen.height));
    const now = performance.now();
    // 0 until the loader lifts, then 1 over INTRO_MS: rise and spin first, the liquid follows, the ring marks the landing.
    const intro = ytIntro.at < 0 ? 0 : clamp01((now - ytIntro.at) / INTRO_MS);
    const arrive = easeOutCubic(clamp01(intro / 0.7));
    const pour = clamp01((intro - 0.3) / 0.7);
    if (!ytIntro.rang && intro >= 0.55) {
      ytIntro.rang = true;
      p.rippleAt = t;
      rippleGain = 0.5;
    }
    root.current.position.set(
      (s.x * vp.width * columnShare(screen.width)) / 2,
      (s.y * vp.height) / 2 + Math.sin(t * 0.9) * 0.025 * s.idle * size - (1 - arrive) * 0.45 * size,
      0,
    );
    root.current.scale.setScalar(size * (1 + p.hover * 0.04 - p.press * 0.06) * (0.4 + 0.6 * easeOutBack(clamp01(intro / 0.75))));

    // Award metals mirror the studio: a big tilt swings coloured reflections across them, so the pointer and sway calm down there.
    const calm = 1 - Math.min(1, s.tier) * 0.75;
    tilt.current.rotation.set(
      s.rotX + smooth.y * TILT_X * calm + Math.sin(t * 0.7) * 0.035 * s.idle + (1 - arrive) * 0.35,
      // The entrance swings in from the other side rather than spinning: the face stays towards the camera from the first frame.
      s.rotY + smooth.x * TILT_Y * calm + Math.sin(t * 0.5) * 0.09 * s.idle * calm + (1 - arrive) * 0.95,
      s.rotZ + Math.sin(t * 0.43) * 0.02 * s.idle,
    );
    press.current.scale.z = 1 - p.hover * 0.12 - p.press * 0.3;

    // Finish (red lacquer or an award metal), then the liquid fill on top: the empty part is grey, the level glows.
    const finish = applyFinish(button, s.tier);
    const triangleGlow = finish.triangleGlow;
    const fill = s.fill * pour * pour * (3 - 2 * pour);
    button.fill.uFill.value = fill;
    button.fill.uTime.value = t;
    button.bodyMaterial.roughness += (1 - fill) * 0.3;
    triangleTint.copy(button.triangleMaterial.color);
    button.triangleMaterial.color.copy(whiteDim).lerp(triangleTint, 0.35 + 0.65 * fill);
    // A little self-light keeps the triangle reading as white against the lacquer even when it faces away from the softbox.
    button.triangleMaterial.emissiveIntensity = (triangleGlow + p.hover * 0.2 + p.press * 0.5) * (0.3 + 0.7 * fill);

    // While the tools orbit it, the button sends out a ring of its own every few seconds, like a signal.
    if (s.orbit > 0.5 && t - lastPulse > ORBIT_PULSE) {
      lastPulse = t;
      p.rippleAt = t;
      rippleGain = 1;
    }

    // Rings run outwards from the silhouette after a click, the second one a beat behind the first.
    let ringsLive = false;
    ripples.forEach((ring, i) => {
      const age = p.rippleAt < 0 ? -1 : (t - p.rippleAt - i * 0.18) / RIPPLE_SECONDS;
      const live = age >= 0 && age < 1;
      ring.visible = live;
      if (!live) return;
      ringsLive = true;
      const e = 1 - Math.pow(1 - age, 3);
      ring.scale.setScalar(1 + e * (0.9 + i * 0.35) * (0.4 + 0.6 * rippleGain));
      (ring.material as MeshBasicMaterial).opacity = (1 - age) * (1 - age) * (0.85 - i * 0.3) * rippleGain;
    });

    // The sweep eases across the face and fades at both edges, about once every 1.8 s.
    const phase = (t / 1.8) % 1;
    const sweep = phase * phase * (3 - 2 * phase);
    scanLines.forEach((line) => {
      line.visible = s.scan > 0.01;
      line.position.x = (sweep - 0.5) * 1.5;
      (line.material as MeshBasicMaterial).opacity = s.scan * line.userData.strength * Math.sin(Math.PI * phase);
    });

    platingLines.forEach((line) => {
      line.visible = finish.sweep >= 0;
      if (!line.visible) return;
      line.position.x = (finish.sweep - 0.5) * 2;
      const material = line.material as MeshBasicMaterial;
      material.color.copy(finish.sweepColor);
      material.opacity = Math.sin(Math.PI * finish.sweep) * line.userData.strength * 0.9;
    });

    // Demand frameloop: keep drawing while anything is alive; otherwise the GPU rests until the next scroll update.
    const settling = Math.abs(parallax.x - smooth.x) + Math.abs(parallax.y - smooth.y) > 1e-3 || Math.abs(p.hoverTarget - p.hover) > 1e-3;
    const filling = fill > 0.001 && fill < 0.999;
    // Under the loader nothing is seen: after the warm-up frame the canvas sleeps until startYtIntro wakes it.
    if (ytIntro.at < 0) return;
    if (intro < 1 || s.idle > 0 || s.scan > 0.01 || filling || p.press > 0 || ringsLive || settling) invalidate();
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
    rippleGain = 1;
    invalidate();
    // On the final screen the button is the call to action: let the press and the first ring play, then go.
    if (ytState.link > 0.5) setTimeout(() => window.location.assign(AUDIT_URL), 420);
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
        {scanLines.map((l, i) => (
          <primitive key={`scan-${i}`} object={l} />
        ))}
        {platingLines.map((l, i) => (
          <primitive key={`plate-${i}`} object={l} />
        ))}
        <Sparkles />
      </group>
      <OrbitRings />
      <ScoreRing />
      <Radar />
      <PainWaves />
    </group>
  );
}
