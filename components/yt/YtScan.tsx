import { SectionHead } from "@/components/yt/SectionHead";
import { ytCopy } from "@/lib/yt/copy";

const c = ytCopy.scan;

function Group({ index }: { index: number }) {
  const g = c.groups[index];
  return (
    <div data-scan-group className="yt-scan-group yt-glass rounded-3xl p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-medium">{g.title}</h3>
        <span className="yt-scan-badge text-[0.7rem] font-medium uppercase tracking-[0.15em]">0{index + 1}</span>
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-sm md:grid-cols-1 lg:grid-cols-2">
        {g.items.map((item) => (
          <li key={item} data-scan-item className="yt-scan-item flex items-center gap-2">
            <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" aria-hidden="true">
              <circle cx="8" cy="8" r="7" className="yt-scan-ring" />
              <path d="M4.8 8.2 7 10.3l4.2-4.6" className="yt-scan-tick" pathLength={1} />
            </svg>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Screen 3. A tall section with a sticky stage (desktop): the button turns to three-quarters with a scan line sweeping over it,
 * while the four groups of checks light up around it in turn and a counter runs up to 35+. On phones it is a plain list.
 */
export function YtScan() {
  return (
    <section id="scan" data-yt-frame="scan" data-scan className="relative pt-[40svh] md:h-[260svh] md:pt-0">
      <div className="flex flex-col px-6 pb-24 md:sticky md:top-0 md:h-svh md:px-16 md:pb-10 md:pt-28">
        <div className="-mx-2 rounded-[2rem] bg-background/70 p-5 backdrop-blur-xl md:mx-auto md:flex md:w-full md:max-w-[80rem] md:flex-1 md:flex-col md:rounded-none md:bg-transparent md:p-0 md:backdrop-blur-none">
          <SectionHead center eyebrow={c.eyebrow} title={c.title} lead={c.lead} />
          <div className="mt-8 grid flex-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(28vw,1fr)_minmax(0,1fr)] md:gap-8">
            <div className="flex flex-col justify-center gap-4 md:gap-6">
              <Group index={0} />
              <Group index={1} />
            </div>
            <div className="order-first flex items-end justify-center md:order-none">
              <p className="yt-glass flex items-baseline gap-2 rounded-full px-5 py-2 text-sm text-muted">
                <span data-scan-count className="text-xl font-semibold tabular-nums text-foreground">
                  35+
                </span>
                {c.counter}
              </p>
            </div>
            <div className="flex flex-col justify-center gap-4 md:gap-6">
              <Group index={2} />
              <Group index={3} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
