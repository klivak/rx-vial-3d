// Dev helper: screenshots the YouTube page after the loader lifts, at several scroll positions (in viewport heights).
// Usage: node scripts/shot-yt.mjs [baseUrl] [vh,vh,...]
import { chromium, devices } from "@playwright/test";

const url = process.argv[2] ?? "http://localhost:3000/youtube/";
const stops = (process.argv[3] ?? "0,1.4").split(",").map(Number);
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });

for (const [name, opts] of [
  ["mobile", devices["Pixel 7"]],
  ["desktop", { viewport: { width: 1440, height: 900 } }],
]) {
  const page = await browser.newPage(opts);
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 200)));
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(url, { waitUntil: "networkidle", timeout: 180_000 });
  await page.waitForFunction(() => !document.documentElement.classList.contains("is-loading"), null, { timeout: 60_000 });
  await page.waitForTimeout(2500);
  for (const vh of stops) {
    await page.evaluate((v) => window.scrollTo(0, innerHeight * v), vh);
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `shots/yt-${name}-${vh}.png` });
  }
  console.log(name, errors.length ? errors : "no errors");
  await page.close();
}
await browser.close();
