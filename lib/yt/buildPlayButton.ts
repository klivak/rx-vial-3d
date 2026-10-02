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
  dispose: () => void;
};

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
    envMapIntensity: 1.1,
  });
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
