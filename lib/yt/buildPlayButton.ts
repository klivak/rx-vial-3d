import {
  Color,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  Path,
  Shape,
  ShapeGeometry,
  Vector2,
  type BufferGeometry,
} from "three";

/** The red body traced from the play-button silhouette (28.57 x 20 units, slightly bulged sides), y flipped to point up. */
function bodyShape(): Shape {
  const s = new Shape();
  const p = (x: number, y: number) => [x - 14.285, 10 - y] as const;
  s.moveTo(...p(27.97, 3.12));
  s.bezierCurveTo(...p(27.64, 1.89), ...p(26.68, 0.93), ...p(25.45, 0.6));
  s.bezierCurveTo(...p(23.22, 0), ...p(14.27, 0), ...p(14.27, 0));
  s.bezierCurveTo(...p(14.27, 0), ...p(5.32, 0), ...p(3.09, 0.6));
  s.bezierCurveTo(...p(1.86, 0.93), ...p(0.9, 1.89), ...p(0.57, 3.12));
  s.bezierCurveTo(...p(0, 5.35), ...p(0, 10), ...p(0, 10));
  s.bezierCurveTo(...p(0, 10), ...p(0, 14.65), ...p(0.57, 16.88));
  s.bezierCurveTo(...p(0.9, 18.11), ...p(1.86, 19.07), ...p(3.09, 19.4));
  s.bezierCurveTo(...p(5.32, 20), ...p(14.27, 20), ...p(14.27, 20));
  s.bezierCurveTo(...p(14.27, 20), ...p(23.22, 20), ...p(25.45, 19.4));
  s.bezierCurveTo(...p(26.68, 19.07), ...p(27.64, 18.11), ...p(27.97, 16.88));
  s.bezierCurveTo(...p(28.57, 14.65), ...p(28.57, 10), ...p(28.57, 10));
  s.bezierCurveTo(...p(28.57, 10), ...p(28.57, 5.35), ...p(27.97, 3.12));
  return s;
}

/** Triangle with rounded corners: each corner is cut back by `r` and bridged with a quadratic curve through the original vertex. */
function roundedTriangle(points: Vector2[], r: number): Shape {
  const s = new Shape();
  const n = points.length;
  points.forEach((v, i) => {
    const prev = points[(i + n - 1) % n];
    const next = points[(i + 1) % n];
    const a = v.clone().add(prev.clone().sub(v).setLength(r));
    const b = v.clone().add(next.clone().sub(v).setLength(r));
    if (i === 0) s.moveTo(a.x, a.y);
    else s.lineTo(a.x, a.y);
    s.quadraticCurveTo(v.x, v.y, b.x, b.y);
  });
  s.closePath();
  return s;
}

/** Visual triangle centre sits a little right of the bounding box centre, as on the original glyph. */
function triangleShape(): Shape {
  const p = (x: number, y: number) => new Vector2(x - 14.285, 10 - y);
  return roundedTriangle([p(11.4, 14.29), p(18.83, 10), p(11.4, 5.71)], 0.9);
}

/** Logo units to metres-ish scene units: the body ends up 1.43 wide and 1 tall. */
const UNIT = 1 / 20;
const BODY_DEPTH = 0.16;
const BODY_BEVEL = 0.06;
const TRI_DEPTH = 0.05;
const TRI_BEVEL = 0.02;

export const playButtonColors = {
  red: "#FF0033",
  redDim: "#5A5560",
  triangle: "#FFFFFF",
};

export type PlayButtonQuality = "high" | "low";

export type PlayButton = {
  group: Group;
  body: Mesh;
  triangle: Mesh;
  bodyMaterial: MeshPhysicalMaterial;
  triangleMaterial: MeshPhysicalMaterial;
  /**
   * Liquid fill of the body: level 0..1, wave time, the colour of the empty part and of the glowing surface line. Plus the damage on
   * "Sound familiar?": how far the cracks have spread (0..1) and how hot they glow (a flash with every hit).
   */
  fill: {
    uFill: { value: number };
    uTime: { value: number };
    uEmpty: { value: Color };
    uEdge: { value: Color };
    uCrack: { value: number };
    uCrackGlow: { value: number };
  };
  dispose: () => void;
};

/**
 * Teaches the body material to be "filled": below a wavy level the surface keeps its colour, above it turns to the empty grey,
 * and the level itself glows like the surface of a liquid. Works in the body's own space, so it turns with the button.
 */
function addFill(material: MeshPhysicalMaterial, fill: PlayButton["fill"]) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, fill);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\nvarying vec3 vFillPos;`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>\nvFillPos = position;`);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vFillPos;
        uniform float uFill;
        uniform float uTime;
        uniform vec3 uEmpty;
        uniform vec3 uEdge;
        uniform float uCrack;
        uniform float uCrackGlow;
        vec2 crackHash(vec2 p) {
          p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
          return fract(sin(p) * 43758.5453);
        }
        // Distance to the nearest border between random cells (two-pass Voronoi): the borders are the crack lines.
        float crackEdge(vec2 p) {
          vec2 n = floor(p);
          vec2 f = fract(p);
          vec2 mg = vec2(0.0);
          vec2 mr = vec2(0.0);
          float md = 8.0;
          for (int j = -1; j <= 1; j++)
            for (int i = -1; i <= 1; i++) {
              vec2 g = vec2(float(i), float(j));
              vec2 r = g + crackHash(n + g) - f;
              float d = dot(r, r);
              if (d < md) { md = d; mr = r; mg = g; }
            }
          md = 8.0;
          for (int j = -2; j <= 2; j++)
            for (int i = -2; i <= 2; i++) {
              vec2 g = mg + vec2(float(i), float(j));
              vec2 r = g + crackHash(n + g) - f;
              if (dot(mr - r, mr - r) > 0.00001) md = min(md, dot(0.5 * (mr + r), normalize(r - mr)));
            }
          return md;
        }
        // Cracks from an impact on the upper left of the face, like a hit on glass: jagged rays running out of it (each with its own
        // length, thinning to a point), broken web rings between them, and a fine shatter right at the hit. All grow with uCrack.
        float crackLines(vec3 pos) {
          if (uCrack < 0.001) return 0.0;
          vec2 q = pos.xy - vec2(-0.4, 0.22);
          float dist = length(q);
          float reach = uCrack * 1.25;
          if (dist > reach) return 0.0;
          float a = atan(q.y, q.x);
          float lines = 0.0;
          for (int k = 0; k < 9; k++) {
            float fk = float(k);
            vec2 h = crackHash(vec2(fk, 3.7));
            float len = (0.3 + 0.7 * h.y) * reach;
            if (dist > len) continue;
            // Each ray wanders a little as it runs out, with a finer zig-zag on top.
            float ang = (fk + 0.15 + 0.7 * h.x) / 9.0 * 6.2832 - 3.1416 + 0.18 * sin(dist * 7.0 + fk * 2.3) + 0.05 * sin(dist * 31.0 + fk);
            float off = abs(mod(a - ang + 3.1416, 6.2832) - 3.1416) * dist;
            float w = 0.0012 + 0.0075 * (1.0 - dist / len);
            lines = max(lines, 1.0 - smoothstep(w * 0.5, w, off));
          }
          // Web rings, each one broken into segments, the outer ones only once the cracks have spread.
          for (int i = 0; i < 3; i++) {
            float fi = float(i);
            float r = (0.1 + fi * 0.12) * (0.6 + 0.4 * uCrack) + 0.012 * sin(a * 13.0 + fi * 5.0);
            float seg = step(0.45, crackHash(vec2(floor(a * 1.43 + fi * 0.37), fi)).x);
            float on = smoothstep(r, r + 0.05, reach * 0.6);
            lines = max(lines, (1.0 - smoothstep(0.0012, 0.0035, abs(dist - r))) * seg * on);
          }
          // Shattered fine right at the hit.
          float shatter = crackEdge(q * 34.0) / 34.0;
          lines = max(lines, (1.0 - smoothstep(0.0008, 0.0025, shatter)) * (1.0 - smoothstep(0.03, 0.09, dist)));
          // The back face stays clean; the hit is on the front.
          return lines * smoothstep(-0.02, 0.06, pos.z);
        }`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        // The wave calms down near empty and full, so a resting button has a flat, still surface.
        float fillCalm = 1.0 - abs(uFill * 2.0 - 1.0);
        float fillLevel = mix(-0.62, 0.62, uFill) + sin(vFillPos.x * 6.0 + uTime * 2.4) * 0.03 * fillCalm + sin(vFillPos.x * 11.0 - uTime * 1.7) * 0.012 * fillCalm;
        float fillInside = smoothstep(fillLevel + 0.006, fillLevel - 0.006, vFillPos.y);
        diffuseColor.rgb = mix(uEmpty, diffuseColor.rgb, fillInside);
        float crack = crackLines(vFillPos);
        diffuseColor.rgb *= 1.0 - crack * 0.85;`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        totalEmissiveRadiance += uEdge * (1.0 - smoothstep(0.0, 0.035, abs(vFillPos.y - fillLevel))) * fillCalm * 1.6;
        // Deep inside the cracks a red ember, flaring with each hit.
        totalEmissiveRadiance += vec3(1.0, 0.1, 0.22) * crack * uCrackGlow;`,
      );
  };
  material.customProgramCacheKey = () => "yt-fill";
}

function extrude(shape: Shape, depth: number, bevel: number, curveSegments: number, bevelSegments: number): BufferGeometry {
  const g = new ExtrudeGeometry(shape, {
    depth: depth / UNIT,
    bevelEnabled: true,
    bevelThickness: bevel / UNIT,
    bevelSize: (bevel * 0.8) / UNIT,
    bevelSegments,
    curveSegments,
  });
  g.scale(UNIT, UNIT, UNIT);
  // Depth runs from -bevel to depth + bevel; centre it on z = 0 so the button turns about its own middle.
  g.translate(0, 0, -depth / 2);
  return g;
}

/**
 * The 3D play button in plain Three.js: a glossy red extruded body and a raised white triangle. The body is lacquer (clearcoat over
 * a slightly rough base) so studio strips slide across it as it turns; the triangle is softer, like moulded plastic.
 */
export function buildPlayButton(quality: PlayButtonQuality): PlayButton {
  const high = quality === "high";
  const bodyGeometry = extrude(bodyShape(), BODY_DEPTH, BODY_BEVEL, high ? 20 : 10, high ? 8 : 4);
  const triangleGeometry = extrude(triangleShape(), TRI_DEPTH, TRI_BEVEL, high ? 10 : 6, high ? 5 : 3);

  const bodyMaterial = new MeshPhysicalMaterial({
    color: new Color(playButtonColors.red),
    roughness: 0.32,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    sheen: high ? 0.4 : 0,
    sheenColor: new Color("#FF6680"),
    // Kept just above zero: crossing zero would recompile the shader mid-scroll; the diamond finish raises it to 1.
    iridescence: 0.001,
    iridescenceIOR: 1.8,
    iridescenceThicknessRange: [250, 900],
    envMapIntensity: 1.1,
  });
  const fill: PlayButton["fill"] = {
    uFill: { value: 1 },
    uTime: { value: 0 },
    uEmpty: { value: new Color(playButtonColors.redDim) },
    uEdge: { value: new Color("#FF5577") },
    uCrack: { value: 0 },
    uCrackGlow: { value: 0 },
  };
  addFill(bodyMaterial, fill);
  const triangleMaterial = new MeshPhysicalMaterial({
    color: new Color(playButtonColors.triangle),
    roughness: 0.38,
    clearcoat: 0.6,
    clearcoatRoughness: 0.2,
    emissive: new Color("#FFFFFF"),
    emissiveIntensity: 0,
    envMapIntensity: 0.9,
  });

  const body = new Mesh(bodyGeometry, bodyMaterial);
  const triangle = new Mesh(triangleGeometry, triangleMaterial);
  // The triangle sits proud of the front face so its bevel catches light separately from the body.
  triangle.position.z = BODY_DEPTH / 2 + BODY_BEVEL + TRI_DEPTH / 2 - 0.004;

  const group = new Group();
  group.add(body, triangle);

  return {
    group,
    body,
    triangle,
    bodyMaterial,
    triangleMaterial,
    fill,
    dispose: () => {
      bodyGeometry.dispose();
      triangleGeometry.dispose();
      bodyMaterial.dispose();
      triangleMaterial.dispose();
    },
  };
}

/** Front face z of the body, for placing effects (press ripple, scan line) right on the button. */
export const PLAY_BUTTON_FRONT_Z = BODY_DEPTH / 2 + BODY_BEVEL;

/** A thin band along the button silhouette, used for the rings that run outwards when the button is pressed. */
export function buildRippleGeometry(): ShapeGeometry {
  const shape = bodyShape();
  const inner = shape.getPoints(24).map((p) => p.clone().multiplyScalar(0.94));
  shape.holes.push(new Path(inner.reverse()));
  const g = new ShapeGeometry(shape, 24);
  g.scale(UNIT, UNIT, UNIT);
  return g;
}
