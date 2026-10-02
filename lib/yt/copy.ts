/**
 * Every word on the YouTube page, in one place for review. Facts come only from AIR's public audit page, the public audit landing
 * and the public tool list. Paid prices are not printed because they change; the plan buttons lead to the audit, which shows them.
 */
export const AUDIT_URL = "https://my.air.io/audit";

export const ytCopy = {
  brand: "AIR",
  product: "YouTube Channel Audit",
  nav: { cta: "Check my channel" },

  loader: {
    label: "YouTube Channel Audit",
    steps: ["Loading the studio", "Polishing the button", "Lighting the set", "Ready"],
  },

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

  scan: {
    eyebrow: "The audit",
    title: "Your channel, read through 35+ independent lenses.",
    lead: "Not just graphs, but exactly where your channel breaks and why.",
    counter: "checks run",
    groups: [
      { title: "Content & publishing", items: ["Upload cadence", "Upload rhythm", "Video length mix", "Shorts ratio", "Content topic", "Seasonality"] },
      { title: "Engagement & community", items: ["Audience retention", "Engagement rate", "Creator reply rate", "Unanswered questions", "Like-to-view ratio", "Reach of new videos"] },
      { title: "SEO & metadata", items: ["Title quality", "Video descriptions", "Tag coverage", "Captions coverage", "Localization signals", "Playlist strategy"] },
      { title: "Channel & compliance", items: ["Channel branding", "Custom thumbnails", "Home page sections", "Monetization status", "Region restrictions", "Made-for-kids flag"] },
    ],
  },

  report: {
    eyebrow: "What you get",
    title: "One score. One bottleneck. One plan.",
    lead: "A 0–100 channel score, a verdict on five areas, the main thing slowing you down and a roadmap in three waves.",
    sample: "Sample report",
    channel: "Demo channel · Tech reviews",
    tier: "Full audit",
    score: 68,
    scoreLabel: "Score",
    ratings: [
      { label: "Discoverability", value: 61 },
      { label: "Engagement", value: 74 },
      { label: "Monetization", value: 58 },
    ],
    areas: [
      { name: "Packaging", detail: "Titles, thumbnails, description", verdict: "Needs work", tone: "bad" },
      { name: "Distribution", detail: "Search, recommendations, traffic", verdict: "Solid", tone: "ok" },
      { name: "Monetization", detail: "Revenue and RPM", verdict: "Room to grow", tone: "mid" },
      { name: "Community", detail: "Comments, replies, loyalty", verdict: "Strong", tone: "good" },
      { name: "Video portfolio", detail: "Formats, length, Shorts mix", verdict: "Solid", tone: "ok" },
    ],
    bottleneck: { label: "Main bottleneck", text: "Packaging: your videos get impressions, but the thumbnails don’t earn the click." },
    roadmap: [
      { when: "This week", what: "Redo the three weakest thumbnails" },
      { when: "This month", what: "Test one title formula on every upload" },
      { when: "This quarter", what: "Rebalance Shorts and long-form" },
    ],
  },

  thumbs: {
    eyebrow: "Thumbnails & hooks",
    title: "Your 15 best and 15 weakest, side by side.",
    lead: "The Full audit reviews 30 thumbnails and their click-through rate, plus the first seconds of your videos: does the hook hold, is there a call to subscribe?",
    best: "Best performers",
    weak: "Weakest",
    note: "Illustration. Your report uses your own videos.",
  },

  plans: {
    eyebrow: "Plans",
    title: "Start free. Go deeper when you’re ready.",
    popular: "Popular",
    cta: "Start here",
    priceCta: "See price",
    tiers: [
      {
        name: "Free Channel Check",
        price: "$0",
        time: "Up to 5 minutes",
        intro: "From a public link:",
        points: ["35+ signals analyzed", "A score out of 100 and your niche focus", "3 recommended first steps", "Connect your channel to add 90 days of analytics"],
      },
      {
        name: "Full Channel Audit",
        price: null,
        time: "Up to 3 days",
        intro: "Everything in Free, plus:",
        points: ["Your main growth bottleneck explained, with 5–8 actions in priority order", "30 thumbnails reviewed", "Up to 3 competitors with niche benchmarks", "Revenue and RPM", "Downloadable PDF, in 6 languages"],
      },
      {
        name: "Channel Growth Blueprint",
        price: null,
        time: "7–15 business days",
        intro: "Written by hand:",
        points: ["A senior AIR strategist works on your channel, to your brief", "3–5 competitors taken apart by hand", "A revenue model built on your own numbers"],
      },
    ],
  },

  how: {
    eyebrow: "How it works",
    title: "From channel to a real action plan in four steps.",
    steps: [
      { title: "Add your channel", text: "Read-only access through Google takes 10 seconds. The free check also works from a public link." },
      { title: "We analyze it", text: "35+ independent analyzers run across your content, engagement, SEO and compliance." },
      { title: "You get your report", text: "Clear verdicts, ranked issues and recommendations made for your channel, not generic advice." },
      { title: "You act, and re-run", text: "Work the plan, then come back to see how the score moved." },
    ],
    trust: ["Read-only access to your channel data", "We can’t upload, edit, or delete anything", "Remove access anytime"],
  },

  tools: {
    eyebrow: "More than an audit",
    title: "A whole studio of tools around your channel.",
    lead: "The audit tells you what to fix. AIR’s creator tools help you fix it.",
    items: [
      { name: "Comments Analyzer", text: "What viewers praise, criticise and ask for, from up to 2,000 comments." },
      { name: "Competitor Insights", text: "Competitors’ videos, engagement and upload rhythm." },
      { name: "Trend Radar", text: "Videos that outperform their own channel, by country and topic." },
      { name: "Idea Generator", text: "Video ideas from your niche and your recent uploads." },
      { name: "Metadata Lab", text: "Titles, descriptions and tags from a draft or a link." },
      { name: "Thumbnail Studio", text: "AI thumbnails in 16:9 and 9:16 with editable text." },
      { name: "Metadata Translation", text: "Translate titles and descriptions and publish in one click." },
      { name: "Video Distribution", text: "Publish beyond YouTube: MSN, Facebook, Tubi and more." },
    ],
  },

  cta: {
    title: "Press play on your channel.",
    lead: "Paste your channel link and get a score and your main bottleneck in minutes.",
    button: "Check my channel for free",
    hint: "or press the big red button",
  },

  faq: {
    title: "Questions creators ask",
    items: [
      { q: "Can I audit my YouTube channel for free?", a: "Yes. The free check works from your channel link and shows a score, the main bottleneck and first steps. Connect your channel with Google to add YouTube Analytics data to the report." },
      { q: "How is the Full audit different from the free one?", a: "The Full audit reads the whole YouTube Analytics set (revenue and RPM, demographics, CTR, retention), reviews your thumbnails and the first seconds of your videos, explains the bottleneck and gives a three-wave plan and a PDF." },
      { q: "How long does the audit take?", a: "The free check takes a few minutes. The Full audit appears quickly and fills in with YouTube Analytics data over three days. The team prepares a Blueprint in 7–15 business days." },
      { q: "Is my channel data safe?", a: "Yes. Access is read-only: we never post or change anything on your channel, your data powers your audit only and is never shared with third parties or other creators." },
      { q: "Do I need to join AIR’s network?", a: "No. The audit is a standalone product: no partnership agreement, no MCN sign-up, no long-term commitment." },
      { q: "Can I run it on a competitor’s channel?", a: "Yes, the free check works on any public YouTube channel. The Full audit and the Blueprint analyze your own channel, since they read private analytics." },
    ],
  },

  footer: {
    company: "AIR Media-Tech",
    trademark: "YouTube is a trademark of Google LLC.",
  },
} as const;
