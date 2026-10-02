// Dev helper: screenshots the local dev server at a phone and a desktop viewport.
// Usage: node scripts/shot.mjs [url] [scrollFraction]
import { chromium, devices } from "@playwright/test";

const url = process.argv[2] ?? "http://localhost:3210/";
const scroll = Number(process.argv[3] ?? 0);
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });

for (const [name, opts] of [
  ["mobile", devices["Pixel 7"]],
  ["desktop", { viewport: { width: 1440, height: 900 } }],
]) {
  const page = await browser.newPage(opts);
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate((f) => window.scrollTo(0, (document.body.scrollHeight - innerHeight) * f), scroll);
  await page.waitForTimeout(4000);
  await page.screenshot({ path: `shots/${name}-${scroll}.png` });
  console.log(name, errors.length ? errors : "no errors");
  await page.close();
}
await browser.close();
