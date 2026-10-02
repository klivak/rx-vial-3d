/**
 * Every word on the YouTube page, in one place for review and translation. Facts come only from AIR's public audit page and
 * public tool list; paid prices are not printed here because they change, the live pricing page is linked instead.
 */
export const AUDIT_URL = "https://air.io/features/youtube-channel-audit";

export const ytCopy = {
  brand: "AIR",
  product: "YouTube Channel Audit",
  nav: { cta: "Check my channel" },

  hero: {
    eyebrow: "YouTube Channel Audit by AIR",
    title: "Putting in the work, but the views aren’t coming?",
    lead: "Find out what’s holding your channel back. We look at your topics, titles, thumbnails and upload mix, and show what’s working, where you’re struggling and what to fix first.",
    cta: "Check my channel for free",
    secondary: "See what’s inside",
    note: "Free. No card. Ready in up to 5 minutes.",
    hint: "Press the button",
  },

  problem: {
    eyebrow: "Sound familiar?",
    title: "It feels like the algorithm. It usually isn’t.",
    lead: "When a channel stops growing, the cause is rarely visible from the inside. More often it’s weak thumbnails, titles that miss what people search for, or viewers leaving in the first seconds.",
    pains: [
      { title: "Views dropped", text: "Same effort, same schedule, half the views." },
      { title: "Subscribers stalled", text: "The counter hasn’t really moved in months." },
      { title: "CTR tanked", text: "Impressions are there, the clicks are not." },
      { title: "Viewers drop off early", text: "The first seconds lose people before the video starts." },
      { title: "Not sure what to fix first", text: "Thumbnails? Titles? Shorts? Everything feels urgent." },
    ],
    chart: { label: "Views, last 12 months", aria: "Illustration: a views chart that climbs, then flattens and slips down." },
  },
} as const;
