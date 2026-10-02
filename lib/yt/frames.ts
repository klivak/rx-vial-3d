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
  /** Strength of the red glow behind the button (CSS). */
  glow: number;
  /** How much the idle float and sway apply. 0 also lets the canvas rest when the button is off screen. */
  idle: number;
  /** Opacity of the scan line sweeping across the button while the audit "reads" the channel. */
  scan: number;
  /** Above 0.5 a click on the button opens the audit (final call to action). */
  link: number;
};

const base = { health: 1, glow: 1, idle: 1, scan: 0, link: 0 };

const hero: YtFrame = { ...base, x: 0.5, y: -0.02, scale: 0.36, rotX: 0.1, rotY: -0.42, rotZ: 0.04 };
const problem: YtFrame = { ...base, x: -0.5, y: 0.02, scale: 0.36, rotX: 0.22, rotY: 0.62, rotZ: -0.16, health: 0, glow: 0.15, idle: 0.6 };
const scan: YtFrame = { ...base, x: 0, y: -0.1, scale: 0.28, rotX: 0.06, rotY: -0.78, rotZ: 0, health: 0.3, glow: 0.4, idle: 0.5, scan: 1 };
const report: YtFrame = { ...base, x: -0.55, y: 0.02, scale: 0.32, rotX: 0.12, rotY: 0.5, rotZ: -0.05 };
/** Parked above the viewport, spun away; idle 0 so the canvas stops drawing while nothing is visible. */
const away: YtFrame = { ...base, x: 0.15, y: 1.7, scale: 0.22, rotX: -0.4, rotY: 2.6, rotZ: 0.25, glow: 0, idle: 0 };
const tools: YtFrame = { ...base, x: 0, y: -0.24, scale: 0.22, rotX: 0.08, rotY: 0, rotZ: 0 };
const cta: YtFrame = { ...base, x: 0, y: 0.42, scale: 0.25, rotX: 0.14, rotY: 0, rotZ: 0, glow: 1.25, link: 1 };

const mobile = {
  hero: { ...hero, x: 0.1, y: -0.74, scale: 0.15, rotY: -0.3 },
  // On phones the button waits above the text, then a frosted text card slides over it.
  problem: { ...problem, x: 0, y: 0.36, scale: 0.16, rotY: 0.5 },
  scan: { ...scan, y: 0.42, scale: 0.15 },
  report: { ...report, x: 0, y: 0.45, scale: 0.13, rotY: 0.35 },
  tools: { ...tools, y: 0.42, scale: 0.15 },
  cta: { ...cta, y: 0.3, scale: 0.2 },
};

/** One entry per `[data-yt-frame]` section, in page order: hero, problem, scan, report, thumbs, plans, how, tools, cta, faq. */
export const ytFrames: Record<"desktop" | "mobile", YtFrame[]> = {
  desktop: [hero, problem, scan, report, away, away, away, tools, cta, away],
  mobile: [mobile.hero, mobile.problem, mobile.scan, mobile.report, away, away, away, mobile.tools, mobile.cta, away],
};
