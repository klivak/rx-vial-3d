import type { CSSProperties } from "react";
import { SectionHead } from "@/components/yt/SectionHead";
import { ytCopy } from "@/lib/yt/copy";

const c = ytCopy.competitors;

/**
 * Screen 6. The button comes back on the left; on the right three benchmark charts, "you" against three competitors. Bars grow
 * from zero as the card scrolls in, the visitor's own bar in YouTube red, the others in AIR blue.
 */
export function YtCompetitors() {
  return (
    <section
      id="competitors"
      data-yt-frame="competitors"
      data-bench
      className="relative flex min-h-[120svh] items-center px-6 pb-24 pt-[36svh] md:px-16 md:pt-24"
    >
      <div className="yt-container pointer-events-none! grid items-center md:grid-cols-[1fr_1.15fr]">
        <div className="hidden md:block" />
        <div className="pointer-events-auto -mx-2 rounded-[2rem] bg-background/70 p-5 backdrop-blur-xl md:mx-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
          <SectionHead eyebrow={c.eyebrow} title={c.title} lead={c.lead} />
          <div data-reveal className="yt-glass mt-8 rounded-[1.75rem] p-5 sm:p-6">
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
              {[c.you, ...c.names].map((name, i) => (
                <span key={name} className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${i === 0 ? "bg-[#FF0033]" : "bg-[#6E8BFF]"}`}
                    style={{ opacity: i === 0 ? 1 : 1 - i * 0.2 }}
                    aria-hidden="true"
                  />
                  {name}
                </span>
              ))}
            </div>
            <div className="mt-6 space-y-6">
              {c.metrics.map((metric) => {
                const max = Math.max(...metric.values);
                return (
                  <div key={metric.label}>
                    <p className="text-sm font-medium">{metric.label}</p>
                    <ul className="mt-3 space-y-1.5">
                      {metric.values.map((value, i) => (
                        <li
                          key={i}
                          className="grid grid-cols-[6.5rem_1fr_3rem] items-center gap-3 text-xs"
                        >
                          <span className={i === 0 ? "font-medium text-foreground" : "text-muted"}>
                            {i === 0 ? c.you : c.names[i - 1]}
                          </span>
                          <span className="h-2 rounded-full bg-white/[0.06]">
                            <span
                              data-bench-bar
                              className={`block h-full origin-left rounded-full ${i === 0 ? "yt-bench-you" : "yt-bench-them"}`}
                              style={
                                {
                                  width: `${(value / max) * 100}%`,
                                  "--o": 1 - (i - 1) * 0.2,
                                } as CSSProperties
                              }
                            />
                          </span>
                          <span
                            className={`text-right tabular-nums ${i === 0 ? "font-medium text-foreground" : "text-muted"}`}
                          >
                            {value}
                            {metric.format}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
            <p className="yt-bottleneck mt-6 rounded-2xl p-4 text-sm">{c.insight}</p>
          </div>
          <p data-reveal className="mt-4 text-xs text-muted">
            {c.note}
          </p>
        </div>
      </div>
    </section>
  );
}
