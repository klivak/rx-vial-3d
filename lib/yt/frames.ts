/**
 * Where the play button rests on each screen of the YouTube page. Position is a fraction of the visible half-width/half-height
 * (so it holds on any aspect ratio), scale is the button height as a fraction of the visible height.
 */
export type YtFrame = {
  x: number;
  y: number;
  scale: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  /** 1: glossy red, lit. 0: greyed out and glitching, the "something is wrong with my channel" state. */
  health: number;
  /** Strength of the red glow behind the button (CSS) and its rim light. */
  glow: number;
  /** How much the idle float and sway apply; 0 while the button is busy doing something authored. */
  idle: number;
};

const hero: YtFrame = { x: 0.5, y: -0.02, scale: 0.36, rotX: 0.1, rotY: -0.42, rotZ: 0.04, health: 1, glow: 1, idle: 1 };
const problem: YtFrame = { x: -0.5, y: 0.02, scale: 0.36, rotX: 0.22, rotY: 0.62, rotZ: -0.16, health: 0, glow: 0.15, idle: 0.6 };

const heroMobile: YtFrame = { ...hero, x: 0.1, y: -0.74, scale: 0.15, rotY: -0.3 };
// On phones the grey button waits above the text, then the frosted text card slides over it.
const problemMobile: YtFrame = { ...problem, x: 0, y: 0.36, scale: 0.16, rotY: 0.5 };

/** One entry per `[data-yt-frame]` section, in page order. */
export const ytFrames: Record<"desktop" | "mobile", YtFrame[]> = {
  desktop: [hero, problem],
  mobile: [heroMobile, problemMobile],
};
