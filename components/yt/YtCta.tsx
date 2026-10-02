import { SplitWords } from "@/components/SplitWords";
import { AUDIT_URL, ytCopy } from "@/lib/yt/copy";

const c = ytCopy.cta;

/** Screen 9. The big red button is the call to action now: pressing it (or the link below) opens the audit. */
export function YtCta() {
  return (
    <section id="start" data-yt-frame="cta" className="relative flex min-h-[115svh] flex-col items-center justify-end px-6 pb-[16svh] text-center md:px-16">
      <h2 className="max-w-3xl text-5xl font-semibold leading-[1.02] tracking-[-0.03em] sm:text-6xl lg:text-7xl">
        <SplitWords text={c.title} />
      </h2>
      <p data-reveal className="mt-5 max-w-md leading-relaxed text-muted">
        {c.lead}
      </p>
      {/* The reveal moves the wrapper: the button's own hover transition would fight a tween on the same transform. */}
      <div data-reveal className="mt-8">
        <a href={AUDIT_URL} data-magnetic className="yt-btn-primary inline-block rounded-full px-7 py-4 text-base font-medium">
          {c.button}
        </a>
      </div>
      <p data-reveal aria-hidden="true" className="mt-5 hidden text-xs uppercase tracking-[0.25em] text-muted md:block">
        {c.hint}
      </p>
    </section>
  );
}
