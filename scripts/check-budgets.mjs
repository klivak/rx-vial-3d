// Performance budgets from docs/SPEC.md, measured on the production build the way a phone would load it.
// Run after `pnpm build`: pnpm check-budgets
import { chromium, devices } from "@playwright/test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { serveOut } from "./serve-out.mjs";

const JS_BUDGET_KB = 400;
const MODEL_BUDGET_KB = 1024;

const server = await serveOut(4174);
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage(devices["Pixel 7"]);

// Record which JS files a phone actually downloads, then weigh them as gzip (body only, no HTTP headers).
const scripts = new Set();
page.on("response", (r) => {
  const { pathname } = new URL(r.url());
  if (pathname.endsWith(".js")) scripts.add(pathname.replace(/^\/rx-vial-3d\//, ""));
});

await page.goto("http://localhost:4174/rx-vial-3d/", { waitUntil: "networkidle" });
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(2000);
await browser.close();
server.close();

let jsKb = 0;
for (const f of scripts) jsKb += gzipSync(readFileSync(`out/${f}`), { level: 9 }).length / 1024;

let failed = false;
const report = (name, value, budget) => {
  const over = value > budget;
  failed ||= over;
  console.log(`${over ? "OVER" : "ok  "} ${name.padEnd(28)} ${value.toFixed(0)} / ${budget} KB`);
};
report("JS transferred (before AR)", jsKb, JS_BUDGET_KB);
for (const f of readdirSync("out/models")) report(`model ${f}`, statSync(`out/models/${f}`).size / 1024, MODEL_BUDGET_KB);
if (failed) process.exit(1);
