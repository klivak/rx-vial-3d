import { asset } from "@/lib/asset";
import { AUDIT_URL, ytCopy } from "@/lib/yt/copy";

/** Slim glass bar: AIR logo, product name and a compact CTA. Slides down with the hero intro once the loader lifts. */
export function YtHeader() {
  return (
    <header data-intro className="fixed inset-x-0 top-0 z-40 px-4 pt-4 md:px-12" style={{ "--i": 0 } as React.CSSProperties}>
      <div className="yt-glass yt-header-bar mx-auto flex max-w-[98rem] items-center justify-between gap-4 rounded-full py-2 pl-5 pr-2">
        <a href="https://air.io" className="flex items-center gap-3" aria-label="AIR home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("/yt/air-logo.svg")} alt="AIR" width={157} height={31} className="h-5 w-auto" />
          <span className="hidden h-4 w-px bg-white/15 sm:block" />
          <span className="hidden text-sm text-muted sm:block">{ytCopy.product}</span>
        </a>
        <a href={AUDIT_URL} data-magnetic className="yt-btn-primary rounded-full px-4 py-2 text-sm font-medium">
          {ytCopy.nav.cta}
        </a>
      </div>
    </header>
  );
}
