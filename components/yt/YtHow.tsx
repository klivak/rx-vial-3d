import { SectionHead } from "@/components/yt/SectionHead";
import { ytCopy } from "@/lib/yt/copy";

const c = ytCopy.how;

/** Screen 7. Four steps on a track that fills with the scroll; each step lights up as the fill reaches it. Trust chips below. */
export function YtHow() {
  return (
    <section id="how" data-yt-frame="how" className="relative px-6 py-28 md:px-16 md:py-36">
      <SectionHead center eyebrow={c.eyebrow} title={c.title} />
      <div data-light-group className="relative mx-auto mt-16 max-w-6xl">
        {/* Track: horizontal on wide screens, vertical on phones, filled by the scroll. */}
        <span className="absolute left-[11px] top-2 bottom-2 w-px bg-white/10 md:left-0 md:right-0 md:top-[11px] md:bottom-auto md:h-px md:w-auto" aria-hidden="true" />
        <span data-grow className="yt-track absolute left-[11px] top-2 bottom-2 w-px origin-top md:left-0 md:right-0 md:top-[11px] md:bottom-auto md:h-px md:w-auto md:origin-left" aria-hidden="true" />
        <ol className="relative grid gap-10 md:grid-cols-4 md:gap-8">
          {c.steps.map((step, i) => (
            <li key={step.title} data-light className="yt-step relative pl-10 md:pl-0">
              <span className="yt-step-dot absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full text-[0.7rem] font-semibold tabular-nums md:static" aria-hidden="true">
                {i + 1}
              </span>
              <h3 className="text-lg font-semibold md:mt-6">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
      <ul className="mx-auto mt-16 flex max-w-4xl flex-wrap justify-center gap-3">
        {c.trust.map((item) => (
          <li key={item} data-reveal className="yt-glass flex items-center gap-2 rounded-full px-4 py-2 text-sm">
            <svg viewBox="0 0 16 16" className="h-4 w-4 text-[#4ADE80]" aria-hidden="true">
              <path d="M8 1.5 13.5 4v4c0 3.2-2.3 5.6-5.5 6.5C4.8 13.6 2.5 11.2 2.5 8V4L8 1.5Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              <path d="M5.6 8.1 7.3 9.7 10.5 6.3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
