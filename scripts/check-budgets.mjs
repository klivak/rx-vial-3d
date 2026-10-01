// Performance budgets from docs/SPEC.md, measured on the production build the way a phone would load it.
// Run after `pnpm build`: pnpm check-budgets
import { chromium, devices } from "@playwright/test";
import { readdirSync, statSync } from "node:fs";
import { serveOut } from "./serve-out.mjs";

const JS_BUDGET_KB = 400;
const MODEL_BUDGET_KB = 1024;

const server = await serveOut(4174);
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage(devices["Pixel 7"]);

// Count transferred (gzip) bytes through the CDP network events, which see the compressed size.
const cdp = await page.context().newCDPSession(page);
await cdp.send("Network.enable");
const transferred = new Map();
const urls = new Map();
cdp.on("Network.responseReceived", (e) => urls.set(e.requestId, e.response.url));
cdp.on("Network.loadingFinished", (e) => transferred.set(e.requestId, e.encodedDataLength));

await page.goto("http://localhost:4174/rx-vial-3d/", { waitUntil: "networkidle" });
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(2000);
await browser.close();
server.close();

let jsKb = 0;
for (const [id, url] of urls) if (url.endsWith(".js")) jsKb += (transferred.get(id) ?? 0) / 1024;

let failed = false;
const report = (name, value, budget) => {
  const over = value > budget;
  failed ||= over;
  console.log(`${over ? "OVER" : "ok  "} ${name.padEnd(28)} ${value.toFixed(0)} / ${budget} KB`);
};
report("JS transferred (before AR)", jsKb, JS_BUDGET_KB);
for (const f of readdirSync("out/models")) report(`model ${f}`, statSync(`out/models/${f}`).size / 1024, MODEL_BUDGET_KB);
if (failed) process.exit(1);
