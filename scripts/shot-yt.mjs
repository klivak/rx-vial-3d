// Dev helper: screenshots the YouTube page after the loader lifts, at several scroll positions (in viewport heights).
// Usage: node scripts/shot-yt.mjs [baseUrl] [stop,stop,...] [mobile|desktop]
// A stop is a number of viewport heights from the top ("1.5") or a section id plus viewport heights past its top ("scan:0.8").
import { chromium, devices } from "@playwright/test";

const url = process.argv[2] ?? "http://localhost:3210/youtube/";
const stops = (process.argv[3] ?? "0,1.4").split(",");
const only = process.argv[4];
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });

for (const [name, opts] of [
  ["mobile", devices["Pixel 7"]],
  ["desktop", { viewport: { width: 1440, height: 900 } }],
]) {
  if (only && only !== name) continue;
  const page = await browser.newPage(opts);
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 200)));
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(url, { waitUntil: "networkidle", timeout: 180_000 });
  await page.waitForFunction(() => !document.documentElement.classList.contains("is-loading"), null, { timeout: 60_000 });
  await page.waitForTimeout(2500);
  for (const stop of stops) {
    await page.evaluate((s) => {
      const [id, vh] = s.includes(":") ? s.split(":") : [null, s];
      const top = id ? document.getElementById(id).getBoundingClientRect().top + scrollY : 0;
      window.scrollTo(0, top + innerHeight * Number(vh));
    }, stop);
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `shots/yt-${name}-${stop.replace(":", "_")}.png` });
  }
  console.log(name, errors.length ? errors : "no errors");
  await page.close();
}
await browser.close();
