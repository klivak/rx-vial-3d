import { YtCompetitors } from "@/components/yt/YtCompetitors";
import { YtCta } from "@/components/yt/YtCta";
import { YtFaq } from "@/components/yt/YtFaq";
import { YtHeader } from "@/components/yt/YtHeader";
import { YtHero } from "@/components/yt/YtHero";
import { YtHow } from "@/components/yt/YtHow";
import { YtMilestones } from "@/components/yt/YtMilestones";
import { YtMotion } from "@/components/yt/YtMotion";
import { YtPlans } from "@/components/yt/YtPlans";
import { YtProblem } from "@/components/yt/YtProblem";
import { YtReport } from "@/components/yt/YtReport";
import { YtScan } from "@/components/yt/YtScan";
import { YtSceneLayer } from "@/components/yt/YtSceneLayer";
import { YtThumbs } from "@/components/yt/YtThumbs";
import { YtTools } from "@/components/yt/YtTools";

/** Twelve screens, each a `[data-yt-frame]` section with its own pose of the 3D button in lib/yt/frames.ts. */
export default function YoutubePage() {
  return (
    <>
      <YtSceneLayer />
      <YtHeader />
      <p className="sr-only">
        A glossy red 3D play button floats next to the text. As you scroll, it turns grey while the page talks about a stalled channel, refills while the audit scans it, turns into silver, gold and diamond creator awards, and comes back at the end as the button that starts the audit.
      </p>
      <main id="content" className="pointer-events-none relative z-10 *:*:pointer-events-auto">
        <YtHero />
        <YtProblem />
        <YtScan />
        <YtReport />
        <YtThumbs />
        <YtCompetitors />
        <YtPlans />
        <YtHow />
        <YtTools />
        <YtMilestones />
        <YtCta />
        <YtFaq />
      </main>
      <YtMotion />
    </>
  );
}
