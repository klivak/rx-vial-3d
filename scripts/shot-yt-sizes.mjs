// Dev helper: screenshots the YouTube page at several desktop sizes and stops, plus the loader at a few moments.
// Usage: node scripts/shot-yt-sizes.mjs [baseUrl] [stop,stop,...]   (a stop is "id:viewportHeights" or a number of viewport heights)
import { chromium } from "@playwright/test";

const url = process.argv[2] ?? "http://localhost:3210/";
const stops = (process.argv[3] ?? "0").split(",");
const sizes = [
  [1920, 1080],
  [1440, 900],
  [1280, 720],
];
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });

for (const [width, height] of sizes) {
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 200)));
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 180_000 });
  if (width === 1440) {
    for (const t of [300, 1200]) {
      await page.waitForTimeout(t === 300 ? 300 : 900);
      await page.screenshot({ path: `shots/yt-loader-${t}.png` });
    }
    await page.waitForFunction(() => document.querySelector(".yt-loader.is-done"), null, { timeout: 60_000 });
    for (const t of [350, 900]) {
      await page.waitForTimeout(t === 350 ? 350 : 550);
      await page.screenshot({ path: `shots/yt-loader-exit-${t}.png` });
    }
  }
  await page.waitForFunction(() => !document.documentElement.classList.contains("is-loading"), null, { timeout: 60_000 });
  await page.waitForTimeout(2500);
  for (const stop of stops) {
    await page.evaluate((s) => {
      const [id, vh] = s.includes(":") ? s.split(":") : [null, s];
      const top = id ? document.getElementById(id).getBoundingClientRect().top + scrollY : 0;
      window.scrollTo(0, top + innerHeight * Number(vh));
    }, stop);
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `shots/yt-${width}-${stop.replace(":", "_")}.png` });
  }
  console.log(width, errors.length ? errors : "no errors");
  await page.close();
}
await browser.close();
