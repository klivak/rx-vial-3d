import type { CSSProperties } from "react";
import { CtaActions } from "@/components/CtaActions";
import { FrameNav } from "@/components/FrameNav";
import { ScrollHint } from "@/components/ScrollHint";
import { SplitWords } from "@/components/SplitWords";

const steps = [
  ["Online consult", "A few questions about you, about 15 minutes."],
  ["Doctor review", "A licensed clinician checks it and writes your plan."],
  ["Delivered to your door", "Plain box, tracked, usually in 2 to 3 days."],
];

const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

const heading = "text-3xl font-semibold tracking-tight sm:text-4xl";

// On phones text sits in the top half of each frame and the model in the bottom half; on wider screens text moves to the side.
const sideFrame = "flex min-h-svh items-start px-6 pt-[12vh] md:items-center md:px-16 md:pt-0";

// The text layer lets pointer events fall through to the canvas (for the last-frame turntable); only section content catches them.
export function Sections() {
  return (
    <main id="content" className="pointer-events-none relative z-10 *:*:pointer-events-auto">
      <section
        data-frame="hero"
        className="relative flex min-h-svh flex-col items-center justify-start px-6 pt-[12vh] text-center"
      >
        <p
          data-reveal
          data-intro
          style={stagger(0)}
          className="text-sm font-medium uppercase tracking-[0.2em] text-muted"
        >
          Aurel Health
        </p>
        <h1
          data-reveal
          data-intro
          style={stagger(1)}
          className="mt-4 max-w-xl text-4xl font-semibold tracking-tight sm:text-6xl"
        >
          Care that comes to you.
        </h1>
        <p data-reveal data-intro style={stagger(2)} className="mt-4 max-w-md text-lg text-muted">
          Personalized treatment, prescribed online, delivered in days.
        </p>
        <ScrollHint />
      </section>

      <section data-frame="formula" className={sideFrame}>
        <div className="max-w-sm">
          <h2 className={heading}>
            <SplitWords text="Clinically backed formula" />
          </h2>
          <ul className="mt-6 space-y-3 text-muted">
            <li data-reveal>Dosed by a licensed clinician for you.</li>
            <li data-reveal>Ingredients with published clinical evidence.</li>
            <li data-reveal>Made in a certified facility.</li>
          </ul>
        </div>
      </section>

      <section data-frame="how" className={sideFrame}>
        <div className="w-full max-w-sm">
          <h2 className={heading}>
            <SplitWords text="How it works" />
          </h2>
          <ol className="mt-6 space-y-3">
            {steps.map(([step, note], i) => (
              // --lit (0..1) is written by the scroll timeline while the matching part of the vial glows.
              <li
                key={step}
                data-reveal
                data-step
                className="step-card relative overflow-hidden rounded-2xl bg-white/70 p-4 pl-5 shadow-sm backdrop-blur"
              >
                <span
                  aria-hidden="true"
                  className="step-bar absolute inset-y-0 left-0 w-1 origin-top bg-accent"
                />
                <span className="text-xs font-medium tabular-nums text-muted">0{i + 1}</span>
                <p className="mt-1 font-medium">{step}</p>
                <p className="mt-0.5 text-sm text-muted">{note}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section data-frame="unboxing" className={`${sideFrame} md:justify-end`}>
        <div className="max-w-sm">
          <h2 className={heading}>
            <SplitWords text="Discreet packaging, tracked delivery." />
          </h2>
          <p data-reveal className="mt-4 text-muted">
            No logos outside, a recyclable insert inside, and live tracking from our pharmacy to
            your mailbox.
          </p>
        </div>
      </section>

      <section
        data-frame="cta"
        className="flex min-h-svh flex-col items-center justify-end gap-4 px-6 pb-16 text-center"
      >
        <h2 className={heading}>
          <SplitWords text="Ready when you are." />
        </h2>
        <CtaActions />
        <p className="text-xs text-muted">
          Aurel is a fictional brand. This is a design demo, not medical advice.
        </p>
      </section>
      <FrameNav />
    </main>
  );
}
