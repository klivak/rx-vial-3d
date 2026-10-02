import { ytFrames, type YtFrame } from "@/lib/yt/frames";

/** Mutable state GSAP writes and useFrame reads, the same pattern as the vial page: scrolling never re-renders React. */
export const ytState: YtFrame = { ...ytFrames.desktop[0] };

export function applyYtFrame(frame: YtFrame) {
  Object.assign(ytState, frame);
}

/** Pointer interaction on the button itself: hover pushes it in, a click plays a press and sends out a ring. */
export const ytPointer = { hover: 0, hoverTarget: 0, press: 0, rippleAt: -1 };
