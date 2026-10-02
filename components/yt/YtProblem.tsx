import { SplitWords } from "@/components/SplitWords";
import { ytCopy } from "@/lib/yt/copy";

const c = ytCopy.problem;

/** Climbs for most of the year, flattens, then slips: the shape every stalled channel knows. */
const VIEWS =
  "M0 196 C40 190 60 176 90 170 S140 150 170 136 S220 118 250 98 S300 74 330 70 S380 66 410 72 S450 70 480 84 S540 112 600 128";

/**
 * Screen 2. The button flies left and goes grey; on the right, a views chart draws itself into a plateau and the familiar pains
 * light up one by one as they pass the middle of the screen.
 */
export function YtProblem() {
  return (
    <section
      id="problem"
      data-yt-frame="problem"
      className="relative flex min-h-[130svh] items-center px-6 pb-24 pt-[44svh] md:px-16 md:pt-24"
    >
      <div className="yt-container pointer-events-none! grid items-center md:grid-cols-2">
        <div className="hidden md:block" />
        <div className="pointer-events-auto -mx-2 max-w-2xl rounded-[2rem] bg-background/70 p-5 backdrop-blur-xl md:mx-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
          <p data-reveal className="yt-eyebrow">
            {c.eyebrow}
          </p>
          <h2 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-[-0.025em] sm:text-5xl">
            <SplitWords text={c.title} />
          </h2>
          <p data-reveal className="mt-5 max-w-xl leading-relaxed text-muted">
            {c.lead}
          </p>

          {/* Styled after a YouTube Studio analytics card: metric tabs, the line with its area, a peak and a pulsing "now". */}
          <figure data-reveal data-chart className="yt-glass mt-8 rounded-3xl p-5">
            <figcaption className="flex items-end justify-between gap-4 border-b border-white/[0.06] pb-3">
              <span className="flex gap-5 whitespace-nowrap text-xs">
                {c.chart.tabs.map((tab, i) => (
                  <span
                    key={tab}
                    className={
                      i === 0
                        ? "yt-tab-active pb-3 -mb-3 font-medium text-foreground"
                        : "text-muted"
                    }
                  >
                    {tab}
                  </span>
                ))}
              </span>
              <span className="hidden text-xs text-muted sm:inline">{c.chart.label}</span>
            </figcaption>
            <svg
              viewBox="0 0 600 220"
              className="mt-4 h-auto w-full overflow-visible"
              role="img"
              aria-label={c.chart.aria}
            >
              <defs>
                <linearGradient id="yt-views-stroke" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0" stopColor="#2E59E7" />
                  <stop offset="0.55" stopColor="#7C3AED" />
                  <stop offset="0.8" stopColor="#8E93A3" />
                  <stop offset="1" stopColor="#FF0033" />
                </linearGradient>
                <linearGradient id="yt-views-area" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#6E5BFF" stopOpacity="0.28" />
                  <stop offset="1" stopColor="#6E5BFF" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[55, 110, 165].map((y) => (
                <line
                  key={y}
                  x1="0"
                  x2="600"
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity="0.08"
                  strokeDasharray="2 6"
                />
              ))}
              <path data-area d={`${VIEWS} L600 220 L0 220 Z`} fill="url(#yt-views-area)" />
              <path
                data-draw
                d={VIEWS}
                fill="none"
                stroke="url(#yt-views-stroke)"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <g data-marker className="yt-marker">
                <line
                  x1="330"
                  x2="330"
                  y1="70"
                  y2="220"
                  stroke="currentColor"
                  strokeOpacity="0.25"
                  strokeDasharray="3 5"
                />
                <circle cx="330" cy="70" r="5" fill="#7C3AED" stroke="#0A0D1A" strokeWidth="3" />
                <text
                  x="330"
                  y="52"
                  textAnchor="middle"
                  className="fill-current text-[13px]"
                  opacity="0.7"
                >
                  {c.chart.peak}
                </text>
              </g>
              <g data-marker className="yt-marker">
                <circle
                  cx="600"
                  cy="128"
                  r="12"
                  fill="#FF0033"
                  opacity="0.25"
                  className="yt-now-pulse"
                />
                <circle cx="600" cy="128" r="5" fill="#FF0033" stroke="#0A0D1A" strokeWidth="3" />
                <text
                  x="588"
                  y="108"
                  textAnchor="end"
                  className="fill-current text-[13px]"
                  opacity="0.7"
                >
                  {c.chart.now}
                </text>
              </g>
            </svg>
            <div
              className="mt-2 flex justify-between text-[0.7rem] uppercase tracking-[0.15em] text-muted/70"
              aria-hidden="true"
            >
              <span>Jan</span>
              <span>Apr</span>
              <span>Jul</span>
              <span>Oct</span>
              <span>Dec</span>
            </div>
          </figure>

          <ul data-light-group className="mt-8 space-y-2">
            {c.pains.map((pain) => (
              <li key={pain.title} data-light className="yt-pain relative flex gap-4 overflow-hidden px-4 py-3">
                <span
                  className="yt-pain-dot mt-2 h-2 w-2 shrink-0 rounded-full"
                  aria-hidden="true"
                />
                <span>
                  <span className="block font-medium">{pain.title}</span>
                  <span className="block text-sm text-muted">{pain.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
