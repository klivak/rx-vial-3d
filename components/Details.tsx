"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";

const stats = [
  { value: 15, suffix: " min", label: "Average online consult" },
  { value: 24, suffix: " h", label: "Clinician review, start to finish" },
  { value: 3, suffix: " days", label: "Typical delivery to your door" },
  { value: 100, suffix: "%", label: "Plain, unbranded outer box" },
];

const features = [
  { name: "Active compound", tag: "Dosed for you", text: "Your clinician picks the strength from your consult answers and adjusts it at every refill check-in." },
  { name: "Amber glass", tag: "UV-safe", text: "The vial blocks the light that degrades the formula, and the cap is child-resistant without being a fight to open." },
  { name: "Lab batch check", tag: "Every lot", text: "Each batch is tested for identity and purity in a certified facility before it is allowed to ship." },
  { name: "Refill reminders", tag: "Automatic", text: "A message a week before you run out. Skip, pause or change the plan in one tap, no phone calls." },
];

const faq = [
  { q: "Do I need a prior prescription?", a: "No. A licensed clinician reviews your online consult and writes the prescription only if the treatment is right for you." },
  { q: "What does the package look like?", a: "A plain box with no brand or product names outside. The vial and its info card are inside." },
  { q: "Can I talk to a real person?", a: "Yes. Message your care team any time; a clinician replies within one business day." },
  { q: "How do I cancel?", a: "From your account, in two taps. There are no cancellation fees." },
];

const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

/** True once the element has scrolled into view; starts the CSS entrance of its `.reveal-item` children. */
function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setInView(true);
        io.disconnect();
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, inView] as const;
}

function Counter({ value, suffix, run }: { value: number; suffix: string; run: boolean }) {
  const [n, setN] = useState(value);
  useEffect(() => {
    if (!run || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / 1400);
      setN(Math.round(value * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, value]);
  return (
    <span className="tabular-nums">
      {n}
      {suffix}
    </span>
  );
}

/** Card spotlight and a slight tilt that follow the pointer, written as CSS variables so React does not re-render. */
function track(e: PointerEvent<HTMLElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width;
  const y = (e.clientY - r.top) / r.height;
  el.style.setProperty("--mx", `${x * 100}%`);
  el.style.setProperty("--my", `${y * 100}%`);
  el.style.setProperty("--rx", `${(0.5 - y) * 6}deg`);
  el.style.setProperty("--ry", `${(x - 0.5) * 6}deg`);
}

function untrack(e: PointerEvent<HTMLElement>) {
  e.currentTarget.style.setProperty("--rx", "0deg");
  e.currentTarget.style.setProperty("--ry", "0deg");
}

/** Long-read section after the 3D story: numbers, expandable feature cards and an FAQ, on a frosted panel over the last frame. */
export function Details() {
  const [statsRef, statsIn] = useInView<HTMLDivElement>();
  const [cardsRef, cardsIn] = useInView<HTMLDivElement>();
  const [faqRef, faqIn] = useInView<HTMLDivElement>();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section aria-labelledby="details-title" className="relative z-10 rounded-t-[2.5rem] bg-background/85 px-6 py-24 shadow-[0_-20px_60px_rgb(0_0_0/0.06)] backdrop-blur-xl md:px-16">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted">The details</p>
        <h2 id="details-title" className="mt-3 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Everything inside the vial, and around it.
        </h2>

        <div ref={statsRef} className={`reveal-group mt-12 grid grid-cols-2 gap-6 md:grid-cols-4 ${statsIn ? "is-in" : ""}`}>
          {stats.map((s, i) => (
            <div key={s.label} className="reveal-item border-t border-foreground/15 pt-4" style={stagger(i)}>
              <p className="text-3xl font-semibold tracking-tight sm:text-4xl">
                <Counter value={s.value} suffix={s.suffix} run={statsIn} />
              </p>
              <p className="mt-1 text-sm text-muted">{s.label}</p>
            </div>
          ))}
        </div>

        <div ref={cardsRef} className={`reveal-group mt-16 grid items-start gap-4 sm:grid-cols-2 ${cardsIn ? "is-in" : ""}`}>
          {features.map((c, i) => (
            <div key={c.name} className="reveal-item" style={stagger(i)}>
              <button
                type="button"
                aria-expanded={open === i}
                onClick={() => setOpen(open === i ? null : i)}
                onPointerMove={track}
                onPointerLeave={untrack}
                className="spot-card relative h-full w-full overflow-hidden rounded-3xl bg-white/70 p-6 text-left shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <span className="flex items-baseline justify-between gap-4">
                  <span className="text-lg font-semibold">{c.name}</span>
                  <span className="shrink-0 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">{c.tag}</span>
                </span>
                <span className={`grid transition-[grid-template-rows] duration-500 ease-out ${open === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                  <span className="overflow-hidden">
                    <span className="block pt-3 text-sm text-muted">{c.text}</span>
                  </span>
                </span>
                <span className="mt-4 block text-xs font-medium text-muted">{open === i ? "Show less" : "Tap to read more"}</span>
              </button>
            </div>
          ))}
        </div>

        <div ref={faqRef} className={`reveal-group mt-16 ${faqIn ? "is-in" : ""}`}>
          <h3 className="text-xl font-semibold">Questions, answered</h3>
          <div className="mt-4 divide-y divide-foreground/10 border-y border-foreground/10">
            {faq.map((f, i) => (
              <details key={f.q} className="reveal-item faq group py-4" style={stagger(i)}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {f.q}
                  <span aria-hidden="true" className="text-xl leading-none text-muted transition-transform duration-300 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-2 max-w-2xl text-sm text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
