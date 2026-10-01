import { Vector2 } from "three";

/** All units are metres so the same model works in AR at real size (~9 cm tall with cap). */
export const VIAL = {
  radius: 0.02,
  bodyTop: 0.062,
  neckRadius: 0.012,
  neckTop: 0.082,
  capRadius: 0.0145,
  capBottom: 0.071,
  capHeight: 0.019,
  labelCenterY: 0.034,
  labelHeight: 0.04,
  labelArc: (200 / 180) * Math.PI,
  /** Inner glass radius and floor, and how high the capsule pile reaches. */
  innerRadius: 0.0185,
  innerFloor: 0.0032,
  fillTop: 0.05,
} as const;

const v = (x: number, y: number) => new Vector2(x, y);

/** Closed outer + inner profile: lathing it gives real wall thickness, which transmission needs to read as glass. */
export const glassProfile: Vector2[] = [
  v(0, 0),
  v(0.017, 0),
  v(0.0195, 0.002),
  v(VIAL.radius, 0.005),
  v(VIAL.radius, VIAL.bodyTop),
  v(0.019, 0.067),
  v(0.0155, 0.071),
  v(VIAL.neckRadius, 0.074),
  v(VIAL.neckRadius, VIAL.neckTop),
  v(0.0105, VIAL.neckTop),
  v(0.0105, 0.0742),
  v(0.014, 0.0712),
  v(0.0175, 0.0668),
  v(0.0185, 0.0618),
  v(0.0185, 0.006),
  v(0.016, 0.0032),
  v(0, 0.0032),
];

