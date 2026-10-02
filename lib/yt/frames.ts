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
  /** How full of colour the button is, 0..1. The red drains out like liquid on "Sound familiar?" and refills during the scan. */
  fill: number;
  /** Finish: 0 red lacquer, 1 silver, 2 gold, 3 diamond (YouTube's 100K / 1M / 10M creator awards). Fractions blend. */
  tier: number;
  /** Strength of the red glow behind the button (CSS). */
  glow: number;
  /** How much the idle float and sway apply. 0 also lets the canvas rest when the button is off screen. */
  idle: number;
  /** Opacity of the scan line sweeping across the button while the audit "reads" the channel. */
  scan: number;
  /** Above 0.5 a click on the button opens the audit (final call to action). */
  link: number;
  /** Orbit rings with running lights and a slow pulse of rings around the button (the tools screen). */
  orbit: number;
};

/**
 * A move that plays while its section scrolls past (after the button has arrived), e.g. the refill during the scan. The next
 * screen's transition then starts from these end values.
 */
export type YtTrack = Partial<YtFrame>;

const base = { fill: 1, tier: 0, glow: 1, idle: 1, scan: 0, link: 0, orbit: 0 };

const hero: YtFrame = { ...base, x: 0.5, y: -0.02, scale: 0.36, rotX: 0.1, rotY: -0.42, rotZ: 0.04 };
const problem: YtFrame = { ...base, x: -0.5, y: 0.02, scale: 0.36, rotX: 0.22, rotY: 0.62, rotZ: -0.16, fill: 0, glow: 0.15, idle: 0.6 };
const scan: YtFrame = { ...base, x: 0, y: -0.1, scale: 0.28, rotX: 0.06, rotY: -0.78, rotZ: 0, fill: 0, glow: 0.4, idle: 0.5, scan: 1 };
const report: YtFrame = { ...base, x: -0.55, y: 0.02, scale: 0.32, rotX: 0.12, rotY: 0.5, rotZ: -0.05 };
/** Parked above the viewport, spun away; idle 0 so the canvas stops drawing while nothing is visible. */
const away: YtFrame = { ...base, x: 0.15, y: 1.7, scale: 0.22, rotX: -0.4, rotY: 2.6, rotZ: 0.25, glow: 0, idle: 0 };
const competitors: YtFrame = { ...base, x: -0.6, y: -0.02, scale: 0.24, rotX: 0.1, rotY: 0.7, rotZ: -0.08, glow: 0.7 };
const tools: YtFrame = { ...base, x: 0, y: -0.24, scale: 0.22, rotX: 0.08, rotY: 0, rotZ: 0, orbit: 1 };
/** Faces the viewer like a plaque on a shelf; the metal changes while the section scrolls (see tracks). */
const milestones: YtFrame = { ...base, x: 0.42, y: -0.04, scale: 0.36, rotX: 0.04, rotY: -0.22, rotZ: 0, glow: 0.5 };
const cta: YtFrame = { ...base, x: 0, y: 0.42, scale: 0.25, rotX: 0.14, rotY: 0, rotZ: 0, glow: 1.25, link: 1 };

const mobile = {
  hero: { ...hero, x: 0.1, y: -0.74, scale: 0.15, rotY: -0.3 },
  // On phones the button waits above the text, then a frosted text card slides over it.
  problem: { ...problem, x: 0, y: 0.36, scale: 0.16, rotY: 0.5 },
  scan: { ...scan, y: 0.42, scale: 0.15 },
  report: { ...report, x: 0, y: 0.45, scale: 0.13, rotY: 0.35 },
  competitors: { ...competitors, x: 0, y: 0.45, scale: 0.13, rotY: 0.4 },
  tools: { ...tools, y: 0.42, scale: 0.15 },
  milestones: { ...milestones, x: 0, y: 0.34, scale: 0.2, rotY: -0.15 },
  cta: { ...cta, y: 0.3, scale: 0.2 },
};

/** One pose per `[data-yt-frame]` section, in page order: hero, problem, scan, report, thumbs, competitors, plans, how, tools, milestones, cta, faq. */
export const ytFrames: Record<"desktop" | "mobile", YtFrame[]> = {
  desktop: [hero, problem, scan, report, away, competitors, away, away, tools, milestones, cta, away],
  mobile: [mobile.hero, mobile.problem, mobile.scan, mobile.report, away, mobile.competitors, away, away, mobile.tools, mobile.milestones, mobile.cta, away],
};

/** In-section tracks by screen index: the scan refills the button, the milestones turn it silver, gold, then diamond. */
export const ytTracks: Partial<Record<number, YtTrack>> = {
  2: { fill: 1, glow: 0.9 },
  9: { tier: 3 },
};
