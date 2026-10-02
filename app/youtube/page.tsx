import { YtHeader } from "@/components/yt/YtHeader";
import { YtHero } from "@/components/yt/YtHero";
import { YtMotion } from "@/components/yt/YtMotion";
import { YtProblem } from "@/components/yt/YtProblem";
import { YtSceneLayer } from "@/components/yt/YtSceneLayer";

export default function YoutubePage() {
  return (
    <>
      <YtSceneLayer />
      <YtHeader />
      <p className="sr-only">
        A glossy red 3D play button floats next to the text. As you scroll, it turns grey and stutters while the page talks about a stalled channel.
      </p>
      <main id="content" className="pointer-events-none relative z-10 *:*:pointer-events-auto">
        <YtHero />
        <YtProblem />
      </main>
      <YtMotion />
    </>
  );
}
