import { asset } from "@/lib/asset";
import { AUDIT_URL, ytCopy } from "@/lib/yt/copy";
import { SectionHead } from "@/components/yt/SectionHead";

const c = ytCopy.faq;

/** Screen 10. FAQ on a frosted panel that slides over the scene, then the footer. Native <details>, animated where supported. */
export function YtFaq() {
  return (
    <section id="faq" data-yt-frame="faq" className="relative z-10 rounded-t-[2.5rem] border-t border-white/[0.06] bg-background/80 px-6 pb-10 pt-24 backdrop-blur-xl md:px-16">
      <SectionHead center title={c.title} />
      <div className="mx-auto mt-12 max-w-3xl divide-y divide-white/[0.08] border-y border-white/[0.08]">
        {c.items.map((item) => (
          <details key={item.q} data-reveal className="yt-faq group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 font-medium">
              {item.q}
              <span className="yt-faq-icon relative h-4 w-4 shrink-0" aria-hidden="true" />
            </summary>
            <p className="pb-5 pr-10 leading-relaxed text-muted">{item.a}</p>
          </details>
        ))}
      </div>
      <footer className="mx-auto mt-24 flex max-w-6xl flex-col items-center justify-between gap-6 border-t border-white/[0.06] pt-8 text-xs text-muted md:flex-row">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("/yt/air-logo.svg")} alt="AIR" width={157} height={31} className="h-4 w-auto opacity-80" />
          <span>© {ytCopy.footer.company}</span>
        </div>
        <a href={AUDIT_URL} className="text-foreground underline-offset-4 hover:underline">
          {ytCopy.nav.cta}
        </a>
        <span>{ytCopy.footer.trademark}</span>
      </footer>
    </section>
  );
}
