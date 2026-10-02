import { ytFrames, type YtFrame } from "@/lib/yt/frames";

/** Mutable state GSAP writes and useFrame reads, the same pattern as the vial page: scrolling never re-renders React. */
export const ytState: YtFrame = { ...ytFrames.desktop[0] };

export function applyYtFrame(frame: YtFrame) {
  Object.assign(ytState, frame);
}

/** Pointer interaction on the button itself: hover pushes it in, a click plays a press and sends out a ring. */
export const ytPointer = { hover: 0, hoverTarget: 0, press: 0, rippleAt: -1 };

/** One-shot effects fired from the page: a heartbeat when a pain lights up on "Sound familiar?" (performance.now() ms). */
export const ytFx = { beatAt: -1 };

export function fireBeat() {
  ytFx.beatAt = performance.now();
}

/** Hero entrance once the loader lifts: the button swings in, fills with red and sends out a ring (performance.now() ms; -1 until then). */
export const ytIntro = { at: -1, rang: false, wake: () => {} };

/** Reduced motion skips the entrance: the button is simply there. */
export function startYtIntro(delayMs: number) {
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  ytIntro.at = still ? 0 : performance.now() + delayMs;
  ytIntro.rang = still;
  // The canvas sleeps under the loader (PlayButton); this draws the first frame of the entrance.
  ytIntro.wake();
}
