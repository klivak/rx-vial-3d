import { SplitWords } from "@/components/SplitWords";
import { ytCopy } from "@/lib/yt/copy";

const c = ytCopy.milestones;

/**
 * Screen 10. A tall section with a sticky stage: while it scrolls, the button turns from red into the Silver, Gold and Diamond
 * creator awards, the subscriber counter climbs from 10K to 10M and each award row lights up as the metal reaches it. All three
 * are driven by the same timeline (`--lit` on each `[data-award]` and `[data-subs]` are written from the button state).
 */
export function YtMilestones() {
  return (
    <section id="milestones" data-yt-frame="milestones" className="relative h-[360svh]">
      <div className="sticky top-0 flex h-svh items-end px-6 pb-10 md:items-center md:px-16 md:pb-0">
        <div className="yt-container">
          <div className="max-w-xl">
            <p data-reveal className="yt-eyebrow">
              {c.eyebrow}
            </p>
            <h2 className="mt-4 text-[2.1rem] font-semibold leading-[1.06] tracking-[-0.025em] sm:text-5xl">
              <SplitWords text={c.title} />
            </h2>
            <p data-reveal className="mt-5 hidden max-w-lg leading-relaxed text-muted md:block">
              {c.lead}
            </p>
            <p data-reveal className="mt-6 flex items-baseline gap-3">
              <span
                data-subs
                className="yt-subs text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl"
              >
                10,000
              </span>
              <span className="text-sm text-muted">{c.counter}</span>
            </p>
            <ol className="mt-6 max-w-md space-y-2">
              {c.awards.map((award, i) => (
                <li
                  key={award.name}
                  data-reveal
                  data-award
                  className={`yt-award is-${["silver", "gold", "diamond"][i]} flex items-center gap-4 rounded-2xl px-4 py-3`}
                >
                  <span className="yt-award-chip h-6 w-8 shrink-0 rounded-md" aria-hidden="true" />
                  <span className="flex-1">
                    <span className="block text-sm font-medium">{award.name}</span>
                    <span className="block text-xs text-muted">{award.at}</span>
                  </span>
                  <svg viewBox="0 0 16 16" className="yt-award-check h-4 w-4" aria-hidden="true">
                    <path
                      d="M3.5 8.4 6.5 11.2 12.5 4.8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </li>
              ))}
            </ol>
            <p data-reveal className="mt-4 text-xs text-muted">
              {c.note}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
