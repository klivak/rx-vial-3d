import { SectionHead } from "@/components/yt/SectionHead";
import { AUDIT_URL, ytCopy } from "@/lib/yt/copy";

const c = ytCopy.plans;

/** Screen 6. Three plans; the cards rise in turn, tilt and catch a spotlight under the pointer. Only the free price is printed. */
export function YtPlans() {
  return (
    <section id="plans" data-yt-frame="plans" className="relative px-6 py-28 md:px-16 md:py-36">
      <SectionHead center eyebrow={c.eyebrow} title={c.title} />
      <ul className="mx-auto mt-14 grid max-w-6xl gap-5 md:grid-cols-3">
        {c.tiers.map((tier, i) => {
          const featured = i === 1;
          return (
            // The reveal moves the <li>; the tilt lives on the card inside, so the two transforms never fight.
            <li key={tier.name} data-reveal className="flex">
              <div
                data-spot
                className={`yt-spot yt-plan relative flex w-full flex-col rounded-[1.75rem] p-6 ${featured ? "is-featured" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold">{tier.name}</h3>
                  {featured && (
                    <span className="yt-badge rounded-full px-2.5 py-1 text-[0.7rem] font-medium">
                      {c.popular}
                    </span>
                  )}
                </div>
                <p className="mt-4 flex items-baseline gap-2">
                  {/* Paid plans lead with their turnaround; the live price is one click away in the audit. */}
                  <span className="text-3xl font-semibold tracking-tight">
                    {tier.price ?? tier.time}
                  </span>
                  {tier.price && <span className="text-sm text-muted">{tier.time}</span>}
                </p>
                <p className="mt-6 text-sm text-muted">{tier.intro}</p>
                <ul className="mt-3 flex-1 space-y-2.5 text-sm">
                  {tier.points.map((point) => (
                    <li key={point} className="flex gap-2.5">
                      <svg
                        viewBox="0 0 16 16"
                        className="mt-0.5 h-4 w-4 shrink-0 text-[#6E8BFF]"
                        aria-hidden="true"
                      >
                        <path
                          d="M3.5 8.4 6.5 11.2 12.5 4.8"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={AUDIT_URL}
                  data-magnetic
                  className={`mt-8 rounded-full px-5 py-3 text-center text-sm font-medium ${featured ? "yt-btn-primary" : "yt-btn-ghost"}`}
                >
                  {tier.price ? c.cta : c.priceCta}
                </a>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
