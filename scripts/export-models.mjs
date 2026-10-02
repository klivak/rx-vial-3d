// Exports the AR models (GLB for Android Scene Viewer, USDZ for iOS Quick Look) from the same code that renders the site.
// Needs the dev server running: pnpm dev, then pnpm export-models
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const BUDGET = 1024 * 1024;
const url = process.argv[2] ?? "http://localhost:3210/export/";

const browser = await chromium.launch();
const page = await browser.newPage();
page.on("pageerror", (e) => console.error(e));
await page.goto(url);
await page.waitForFunction(() => typeof window.exportModels === "function", null, { timeout: 60_000 });
const files = await page.evaluate(() => window.exportModels());
await browser.close();

await mkdir("public/models", { recursive: true });
let failed = false;
for (const [name, b64] of Object.entries(files)) {
  const bytes = Buffer.from(b64, "base64");
  await writeFile(`public/models/${name}`, bytes);
  const over = bytes.length > BUDGET;
  failed ||= over;
  console.log(`${over ? "OVER" : "ok  "} ${name.padEnd(20)} ${(bytes.length / 1024).toFixed(0)} KB`);
}
if (failed) {
  console.error(`Model over the ${BUDGET / 1024} KB budget`);
  process.exit(1);
}
