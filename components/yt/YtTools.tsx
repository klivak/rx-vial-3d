import { SectionHead } from "@/components/yt/SectionHead";
import { ytCopy } from "@/lib/yt/copy";

const c = ytCopy.tools;

/**
 * Screen 8. The button drops back in from above and the AIR tools circle it on a tilted orbit (desktop, sticky stage): the scroll
 * turns the orbit, cards at the front grow and brighten, cards at the back shrink and dim. On phones the tools are a plain grid.
 */
export function YtTools() {
  return (
    <section id="tools" data-yt-frame="tools" data-orbit className="relative pt-[40svh] md:h-[240svh] md:pt-0">
      <div className="px-6 pb-24 md:sticky md:top-0 md:h-svh md:overflow-hidden md:px-16 md:pb-0 md:pt-24">
        <div className="-mx-2 rounded-[2rem] bg-background/70 p-5 backdrop-blur-xl md:contents">
          <SectionHead center eyebrow={c.eyebrow} title={c.title} lead={c.lead} />
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 md:mt-0">
            {c.items.map((tool, i) => (
              <li key={tool.name} data-orbit-item className="yt-tool yt-glass rounded-2xl p-5 md:absolute md:left-1/2 md:top-[62%] md:w-64 lg:w-72">
                <span className="yt-tool-icon flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 text-base font-semibold">{tool.name}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{tool.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
