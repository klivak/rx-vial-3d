import { SectionHead } from "@/components/yt/SectionHead";
import { ytCopy } from "@/lib/yt/copy";

const c = ytCopy.thumbs;

type Thumb = { text: string; from: string; to: string; ctr: string; time: string };

/** Illustrative thumbnails: the strong ones are bold, high-contrast, three words; the weak ones are murky with tiny, long text. */
const best: Thumb[] = [
  { text: "30 DAYS LATER", from: "#FF3D3D", to: "#FFB238", ctr: "9.4%", time: "14:08" },
  { text: "$10 vs $1000", from: "#2E59E7", to: "#22D3EE", ctr: "8.7%", time: "11:52" },
  { text: "DON’T BUY THIS", from: "#111827", to: "#FF0033", ctr: "8.1%", time: "9:31" },
  { text: "IT ACTUALLY WORKS", from: "#16A34A", to: "#A3E635", ctr: "7.6%", time: "12:44" },
  { text: "BEFORE / AFTER", from: "#7C3AED", to: "#F472B6", ctr: "7.2%", time: "8:15" },
  { text: "THE TRUTH", from: "#F59E0B", to: "#EF4444", ctr: "6.9%", time: "16:20" },
];
const weak: Thumb[] = [
  { text: "my vlog #47 part 2 (new update video)", from: "#4B4A45", to: "#5E5A52", ctr: "1.9%", time: "23:41" },
  { text: "Review", from: "#3F4752", to: "#4A505A", ctr: "1.6%", time: "18:02" },
  { text: "unboxing video of the new thing i got today", from: "#55493F", to: "#6B5E50", ctr: "1.4%", time: "31:15" },
  { text: "episode 12", from: "#383C47", to: "#434756", ctr: "1.2%", time: "27:09" },
  { text: "random stuff compilation", from: "#4A4140", to: "#5A4F4C", ctr: "1.1%", time: "19:48" },
  { text: "stream highlights 03/14", from: "#3E4441", to: "#4C524E", ctr: "0.9%", time: "42:30" },
];

function Card({ thumb, strong }: { thumb: Thumb; strong: boolean }) {
  return (
    <li data-thumb className="yt-thumb">
      <div className="relative aspect-video overflow-hidden rounded-xl" style={{ background: `linear-gradient(135deg, ${thumb.from}, ${thumb.to})` }}>
        {strong ? (
          <>
            <span className="absolute -bottom-3 -right-2 h-[78%] aspect-square rounded-full bg-black/25" aria-hidden="true" />
            <span className="absolute left-3 top-3 max-w-[70%] text-[clamp(0.8rem,1.4vw,1.15rem)] font-semibold leading-[1.05] text-white [text-shadow:0_2px_10px_rgb(0_0_0/0.35)]">{thumb.text}</span>
          </>
        ) : (
          <>
            <span className="absolute inset-3 rounded-md border border-white/5 bg-white/[0.04]" aria-hidden="true" />
            <span className="absolute left-3 top-3 max-w-[85%] text-[0.55rem] leading-tight text-white/45">{thumb.text}</span>
          </>
        )}
        <span className="absolute bottom-1.5 right-1.5 rounded bg-black/75 px-1 py-px text-[0.6rem] font-medium tabular-nums text-white">{thumb.time}</span>
      </div>
      <p className="mt-1.5 flex items-center justify-between text-xs">
        <span className="text-muted">CTR</span>
        <span className={`font-medium tabular-nums ${strong ? "text-[#4ADE80]" : "text-[#FF5C7A]"}`}>{thumb.ctr}</span>
      </p>
    </li>
  );
}

/** Screen 5. The thumbnail review: twelve thumbnails start scattered across the screen and the scroll sorts them by click-through. */
export function YtThumbs() {
  return (
    <section id="thumbnails" data-yt-frame="thumbs" data-thumbs className="relative overflow-x-clip px-6 py-28 md:px-16 md:py-36">
      <SectionHead center eyebrow={c.eyebrow} title={c.title} lead={c.lead} />
      <div className="mx-auto mt-14 grid max-w-6xl gap-10 md:grid-cols-2 md:gap-12">
        {[
          { label: c.best, list: best, strong: true },
          { label: c.weak, list: weak, strong: false },
        ].map((group) => (
          <div key={group.label}>
            <p data-reveal className="flex items-center gap-2 text-sm font-medium">
              <span className={`h-2 w-2 rounded-full ${group.strong ? "bg-[#4ADE80]" : "bg-[#FF5C7A]"}`} aria-hidden="true" />
              {group.label}
            </p>
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {group.list.map((thumb) => (
                <Card key={thumb.text} thumb={thumb} strong={group.strong} />
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p data-reveal className="mt-8 text-center text-xs text-muted">
        {c.note}
      </p>
    </section>
  );
}
