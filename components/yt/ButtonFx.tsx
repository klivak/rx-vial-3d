"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import {
  AdditiveBlending,
  BufferGeometry,
  EllipseCurve,
  Group,
  LineBasicMaterial,
  LineLoop,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
  Vector3,
} from "three";
import { buildSilhouetteGeometry, PLAY_BUTTON_FRONT_Z } from "@/lib/yt/buildPlayButton";
import { glitchAt } from "@/lib/yt/glitch";
import { ytState } from "@/lib/yt/state";

/**
 * Colour-split ghosts for the glitch: a red and a cyan copy of the silhouette, added on top of the button and pulled apart
 * sideways for a few frames whenever a pain lights up on "Sound familiar?". Lives inside the button's tilt group.
 */
export function GlitchGhosts() {
  const ghosts = useMemo(() => {
    const geometry = buildSilhouetteGeometry();
    return ["#FF1744", "#00E5FF"].map((color) => {
      const m = new Mesh(geometry, new MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending }));
      m.position.z = PLAY_BUTTON_FRONT_Z + 0.02;
      m.visible = false;
      return m;
    });
  }, []);

  useEffect(
    () => () => {
      ghosts[0].geometry.dispose();
      ghosts.forEach((g) => (g.material as MeshBasicMaterial).dispose());
    },
    [ghosts],
  );

  useFrame(() => {
    const g = glitchAt(performance.now());
    ghosts.forEach((ghost, i) => {
      ghost.visible = g.split > 0;
      if (!ghost.visible) return;
      ghost.position.x = (i === 0 ? -1 : 1) * g.split;
      ghost.position.y = (i === 0 ? 1 : -1) * g.split * 0.25;
      (ghost.material as MeshBasicMaterial).opacity = 0.22 * g.strength;
    });
  });

  return (
    <>
      {ghosts.map((g, i) => (
        <primitive key={i} object={g} />
      ))}
    </>
  );
}

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
      const p = r.curve.getPoint((((t * r.speed) / (Math.PI * 2) + i * 0.5) % 1 + 1) % 1);
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
