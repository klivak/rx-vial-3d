import { expect, test } from "@playwright/test";

const AUDIT = "https://my.air.io/audit";

test("YouTube page boots: loader, headline, then the 3D button, without errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("./");

  await expect(page.getByRole("progressbar", { name: "Loading" })).toBeAttached();
  await expect(page.getByRole("heading", { level: 1, name: "Putting in the work, but the views aren’t coming?" })).toBeAttached();
  await expect(page.locator("#scene-layer canvas[data-dots]")).toBeAttached();
  await expect(page.locator("#scene-layer canvas:not([data-dots])")).toBeAttached({ timeout: 20_000 });
  await expect(page.locator("html")).not.toHaveClass(/is-loading/, { timeout: 10_000 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.getByRole("link", { name: "See what’s inside" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Your channel, read through 35+ independent lenses." })).toBeInViewport({ timeout: 5_000 });
  expect(errors).toEqual([]);
});

test("YouTube page has all twelve screens with real headings", async ({ page }) => {
  await page.goto("./");
  await expect(page.locator("[data-yt-frame]")).toHaveCount(12);
  // SplitWords puts a space inside every word mask, so compare text with whitespace collapsed.
  const headings = (await page.getByRole("heading", { level: 2 }).allTextContents()).map((t) => t.replace(/\s+/g, " ").trim());
  expect(headings).toEqual([
    "It feels like the algorithm. It usually isn’t.",
    "Your channel, read through 35+ independent lenses.",
    "One score. One bottleneck. One plan.",
    "Your 15 best and 15 weakest, side by side.",
    "See where you stand in your niche.",
    "Start free. Go deeper when you’re ready.",
    "From channel to a real action plan in four steps.",
    "A whole studio of tools around your channel.",
    "Every Play Button starts with one fix.",
    "Press play on your channel.",
    "Questions creators ask",
  ]);
});

test("every call to action opens the YouTube audit", async ({ page }) => {
  await page.goto("./");
  const ctas = page.getByRole("link", { name: /Check my channel|Start here|See price/ });
  expect(await ctas.count()).toBeGreaterThanOrEqual(6);
  for (const link of await ctas.all()) await expect(link).toHaveAttribute("href", AUDIT);
});
