import { SplitWords } from "@/components/SplitWords";

/** Eyebrow, masked-word heading and lead, shared by every screen after the hero. */
export function SectionHead({ eyebrow, title, lead, center = false }: { eyebrow?: string; title: string; lead?: string; center?: boolean }) {
  return (
    <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-xl"}>
      {eyebrow && (
        <p data-reveal className="yt-eyebrow">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-[-0.025em] sm:text-5xl">
        <SplitWords text={title} />
      </h2>
      {lead && (
        <p data-reveal className={`mt-5 leading-relaxed text-muted ${center ? "mx-auto max-w-xl" : "max-w-lg"}`}>
          {lead}
        </p>
      )}
    </div>
  );
}
