// Renders frame 1 of the live scene without the text layer and saves it as the loading poster (shown until WebGL draws, and as the no-WebGL fallback).
// Needs the dev server running: pnpm dev, then pnpm make-poster
import { chromium, devices } from "@playwright/test";
import { execFileSync } from "node:child_process";

const url = process.argv[2] ?? "http://localhost:3210/vial/?quality=high";
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });

for (const [name, opts] of [
  ["mobile", { ...devices["Pixel 7"], deviceScaleFactor: 2 }],
  ["desktop", { viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 }],
]) {
  const page = await browser.newPage({ ...opts, reducedMotion: "reduce" });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: "#content, [data-poster], nextjs-portal { display: none !important; }" });
  await page.waitForTimeout(4000);
  const png = `shots/poster-${name}.png`;
  await page.screenshot({ path: png });
  await page.close();
  execFileSync("python", [
    "-c",
    `from PIL import Image; Image.open("${png}").convert("RGB").save("public/poster-${name}.webp", "WEBP", quality=72, method=6)`,
  ]);
  console.log(`public/poster-${name}.webp`);
}
await browser.close();
