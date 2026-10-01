/**
 * Camera and object states for the five scroll frames. This is data, not code: tuning the motion means editing numbers here.
 * The camera orbits `target` on a circle (azimuth in radians, 0 = looking at the label from +z), so tweening azimuth can never cut through the model.
 */
export type FrameState = {
  azimuth: number;
  radius: number;
  camY: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  vialRotY: number;
  vialLift: number;
  /** 0: box parked out of shot to the side, 1: in place. */
  boxIn: number;
  boxLid: number;
  hCap: number;
  hLabel: number;
  hBox: number;
  bgTone: number;
  idle: number;
};

const base: FrameState = {
  azimuth: 0,
  radius: 0.42,
  camY: 0.06,
  targetX: 0,
  targetY: 0.07,
  targetZ: 0,
  vialRotY: 0,
  vialLift: 0,
  boxIn: 0,
  boxLid: 0,
  hCap: 0,
  hLabel: 0,
  hBox: 0,
  bgTone: 0,
  idle: 0,
};

const f = (s: Partial<FrameState>): FrameState => ({ ...base, ...s });

export const frames: Record<"desktop" | "mobile", FrameState[]> = {
  desktop: [
    f({ vialRotY: -0.5, idle: 1 }),
    f({ radius: 0.26, camY: 0.05, targetX: -0.026, targetY: 0.045 }),
    f({ azimuth: 1.6, radius: 0.46, camY: 0.13, targetX: 0.035, targetY: 0.045, targetZ: -0.03, vialRotY: 0.6, boxIn: 1, hBox: 1 }),
    f({ azimuth: 0.6, radius: 0.42, camY: 0.17, targetX: 0.085, targetY: 0.04, targetZ: -0.03, vialRotY: 0.4, vialLift: 0.012, boxIn: 1, boxLid: 1 }),
    f({ azimuth: 0.25, radius: 0.56, camY: 0.1, targetX: 0.025, targetY: 0.05, vialRotY: 0.1, boxIn: 1, boxLid: 1, bgTone: 1, idle: 1 }),
  ],
  // Narrow screens: text sits in the top half, so targets are raised to drop the model into the lower half, and the camera pulls back to keep the box in frame.
  mobile: [
    f({ radius: 0.5, targetY: 0.088, vialRotY: -0.5, idle: 1 }),
    f({ radius: 0.3, camY: 0.04, targetY: 0.065 }),
    f({ azimuth: 1.6, radius: 0.7, camY: 0.15, targetX: 0.05, targetY: 0.115, targetZ: -0.03, vialRotY: 0.6, boxIn: 1, hBox: 1 }),
    f({ azimuth: 0.6, radius: 0.72, camY: 0.22, targetX: 0.065, targetY: 0.075, targetZ: -0.03, vialRotY: 0.4, vialLift: 0.012, boxIn: 1, boxLid: 1 }),
    f({ azimuth: 0.25, radius: 0.78, camY: 0.1, targetX: 0.045, targetY: 0.03, vialRotY: 0.1, boxIn: 1, boxLid: 1, bgTone: 1, idle: 1 }),
  ],
};

/** Share of each frame-to-frame scroll segment spent moving; the rest is a still plateau. */
export const MOVE_SHARE = 0.8;

export const MAX_AZIMUTH_STEP = (120 / 180) * Math.PI;
export const MIN_CAMERA_RADIUS = 0.15;

/** Dev-only guard for the motion rules: no camera turn over 120 degrees per frame, never inside the model. */
export function validateFrames() {
  for (const [name, list] of Object.entries(frames)) {
    list.forEach((s, i) => {
      if (s.radius < MIN_CAMERA_RADIUS) console.warn(`[frames] ${name}[${i}] camera too close`);
      const prev = list[i - 1];
      if (prev && Math.abs(s.azimuth - prev.azimuth) > MAX_AZIMUTH_STEP) console.warn(`[frames] ${name}[${i}] turn over 120 degrees`);
    });
  }
}
