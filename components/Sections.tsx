import { CtaActions } from "@/components/CtaActions";

const heading = "text-3xl font-semibold tracking-tight sm:text-4xl";

// On phones text sits in the top half of each frame and the model in the bottom half; on wider screens text moves to the side.
const sideFrame = "flex min-h-svh items-start px-6 pt-[12vh] md:items-center md:px-16 md:pt-0";

// The text layer lets pointer events fall through to the canvas (for the last-frame turntable); only section content catches them.
export function Sections() {
  return (
    <main id="content" className="pointer-events-none relative z-10 *:*:pointer-events-auto">
      <section data-frame="hero" className="relative flex min-h-svh flex-col items-center justify-start px-6 pt-[12vh] text-center">
        <p data-reveal className="text-sm font-medium uppercase tracking-[0.2em] text-muted">
          Aurel Health
        </p>
        <h1 data-reveal className="mt-4 max-w-xl text-4xl font-semibold tracking-tight sm:text-6xl">
          Care that comes to you.
        </h1>
        <p data-reveal className="mt-4 max-w-md text-lg text-muted">
          Personalized treatment, prescribed online, delivered in days.
        </p>
        <p className="absolute bottom-8 text-xs uppercase tracking-[0.2em] text-muted" aria-hidden="true">
          Scroll
        </p>
      </section>

      <section data-frame="formula" className={sideFrame}>
        <div className="max-w-sm">
          <h2 data-reveal className={heading}>
            Clinically backed formula
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
          <h2 data-reveal className={heading}>
            How it works
          </h2>
          <ol className="mt-6 space-y-3">
            {["Online consult", "Doctor review", "Delivered to your door"].map((step, i) => (
              <li key={step} data-reveal className="rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur">
                <span className="text-xs font-medium text-muted">Step {i + 1}</span>
                <p className="mt-1 font-medium">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section data-frame="unboxing" className={`${sideFrame} md:justify-end`}>
        <h2 data-reveal className={`${heading} max-w-sm`}>
          Discreet packaging, tracked delivery.
        </h2>
      </section>

      <section data-frame="cta" className="flex min-h-svh flex-col items-center justify-end gap-4 px-6 pb-16 text-center">
        <h2 data-reveal className={heading}>
          Ready when you are.
        </h2>
        <CtaActions />
        <p className="text-xs text-muted">Aurel is a fictional brand. This is a design demo, not medical advice.</p>
      </section>
    </main>
  );
}
