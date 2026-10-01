import { frames, type FrameState } from "@/lib/frames";

/**
 * Single mutable object that GSAP writes and useFrame reads. Scroll never triggers React renders;
 * components apply these numbers to meshes and the camera each frame.
 */
export const sceneState: FrameState = { ...frames.desktop[0] };

export function applyFrame(state: FrameState) {
  Object.assign(sceneState, state);
}

/** Last-frame turntable: a drag offset added to the camera azimuth, with momentum, easing back to 0 when disabled. */
export const turntable = { enabled: false, dragging: false, offset: 0, velocity: 0 };
