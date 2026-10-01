const buttonBase =
  "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function Sections() {
  return (
    <main id="content" className="relative z-10">
      <section data-frame="hero" className="flex min-h-svh flex-col items-center justify-start px-6 pt-[12vh] text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted">Aurel Health</p>
        <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight sm:text-6xl">Care that comes to you.</h1>
        <p className="mt-4 max-w-md text-lg text-muted">Personalized treatment, prescribed online, delivered in days.</p>
        <p className="absolute bottom-8 text-xs uppercase tracking-[0.2em] text-muted" aria-hidden="true">
          Scroll
        </p>
      </section>

      <section data-frame="formula" className="flex min-h-svh items-center px-6 sm:px-16">
        <div className="max-w-sm">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Clinically backed formula</h2>
          <ul className="mt-6 space-y-3 text-muted">
            <li>Dosed by a licensed clinician for you.</li>
            <li>Ingredients with published clinical evidence.</li>
            <li>Made in a certified facility.</li>
          </ul>
        </div>
      </section>

      <section data-frame="how" className="flex min-h-svh items-center px-6 sm:px-16">
        <div className="w-full max-w-sm">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">How it works</h2>
          <ol className="mt-6 space-y-3">
            {["Online consult", "Doctor review", "Delivered to your door"].map((step, i) => (
              <li key={step} className="rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur">
                <span className="text-xs font-medium text-muted">Step {i + 1}</span>
                <p className="mt-1 font-medium">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section data-frame="unboxing" className="flex min-h-svh items-center justify-end px-6 sm:px-16">
        <h2 className="max-w-sm text-3xl font-semibold tracking-tight sm:text-4xl">Discreet packaging, tracked delivery.</h2>
      </section>

      <section data-frame="cta" className="flex min-h-svh flex-col items-center justify-end gap-4 px-6 pb-16 text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Ready when you are.</h2>
        <div className="flex flex-wrap justify-center gap-3">
          <a href="#" className={`${buttonBase} bg-foreground text-background hover:bg-accent`}>
            Start your visit
          </a>
          <button type="button" className={`${buttonBase} border border-foreground/20 hover:bg-foreground/5`}>
            View in AR
          </button>
        </div>
        <p className="text-xs text-muted">Aurel is a fictional brand. This is a design demo, not medical advice.</p>
      </section>
    </main>
  );
}
