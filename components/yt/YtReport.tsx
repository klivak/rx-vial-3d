import { SectionHead } from "@/components/yt/SectionHead";
import { ytCopy } from "@/lib/yt/copy";

const c = ytCopy.report;
const RING = 2 * Math.PI * 52;

/**
 * Screen 4. The button flies back left and gets its red back ("the channel recovers"); on the right a sample report builds
 * itself: the score ring fills and counts up, the ratings grow, the five verdicts and the plan arrive one after another.
 */
export function YtReport() {
  return (
    <section id="report" data-yt-frame="report" data-report className="relative grid min-h-[130svh] items-center px-6 pb-24 pt-[36svh] md:grid-cols-[1fr_1.15fr] md:px-16 md:pt-24">
      <div className="hidden md:block" />
      <div className="-mx-2 rounded-[2rem] bg-background/70 p-5 backdrop-blur-xl md:mx-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <SectionHead eyebrow={c.eyebrow} title={c.title} lead={c.lead} />

        <article data-reveal className="yt-glass yt-report mt-8 rounded-[1.75rem] p-5 sm:p-6" aria-label={c.sample}>
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="yt-avatar h-9 w-9 rounded-full" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium">{c.channel}</p>
                <p className="text-xs text-muted">{c.tier}</p>
              </div>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-[0.7rem] uppercase tracking-[0.15em] text-muted">{c.sample}</span>
          </header>

          <div className="mt-6 grid items-center gap-6 sm:grid-cols-[auto_1fr]">
            <div className="relative mx-auto h-32 w-32">
              <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth="9" />
                <circle
                  data-ring={c.score}
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="url(#yt-score)"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={RING}
                  strokeDashoffset={RING * (1 - c.score / 100)}
                />
                <defs>
                  <linearGradient id="yt-score" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0" stopColor="#2E59E7" />
                    <stop offset="1" stopColor="#7C3AED" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span data-count={c.score} className="text-4xl font-semibold tabular-nums">
                  {c.score}
                </span>
                <span className="text-[0.65rem] uppercase tracking-[0.15em] text-muted">{c.scoreLabel}</span>
              </div>
            </div>
            <ul className="space-y-3">
              {c.ratings.map((r) => (
                <li key={r.label}>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">{r.label}</span>
                    <span data-count={r.value} className="font-medium tabular-nums">
                      {r.value}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-white/[0.08]">
                    <span data-bar className="yt-bar block h-full origin-left rounded-full" style={{ width: `${r.value}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <ul className="mt-6 divide-y divide-white/[0.06] border-y border-white/[0.06]">
            {c.areas.map((a) => (
              <li key={a.name} data-row className="flex items-center justify-between gap-3 py-2.5">
                <span>
                  <span className="block text-sm font-medium">{a.name}</span>
                  <span className="block text-xs text-muted">{a.detail}</span>
                </span>
                <span className={`yt-verdict is-${a.tone} shrink-0 rounded-full px-2.5 py-1 text-xs font-medium`}>{a.verdict}</span>
              </li>
            ))}
          </ul>

          <div data-row className="yt-bottleneck mt-5 rounded-2xl p-4">
            <p className="text-[0.7rem] font-medium uppercase tracking-[0.15em] text-[#FF5C7A]">{c.bottleneck.label}</p>
            <p className="mt-1 text-sm">{c.bottleneck.text}</p>
          </div>

          <ol className="mt-5 grid gap-3 sm:grid-cols-3">
            {c.roadmap.map((step, i) => (
              <li key={step.when} data-row className="rounded-2xl bg-white/[0.03] p-3">
                <span className="text-[0.7rem] font-medium uppercase tracking-[0.12em] text-muted">
                  {i + 1} · {step.when}
                </span>
                <p className="mt-1 text-sm">{step.what}</p>
              </li>
            ))}
          </ol>
        </article>
      </div>
    </section>
  );
}
