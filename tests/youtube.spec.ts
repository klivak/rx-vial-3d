import { expect, test } from "@playwright/test";

test("YouTube page boots: headline first, then the 3D button, without errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("youtube/");

  await expect(page.getByRole("heading", { level: 1, name: "Putting in the work, but the views aren’t coming?" })).toBeVisible();
  await expect(page.locator("#scene-layer canvas")).toBeAttached({ timeout: 20_000 });
  await expect(page.locator("html")).not.toHaveClass(/is-loading/, { timeout: 10_000 });

  await page.getByRole("link", { name: "See what’s inside" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "It feels like the algorithm. It usually isn’t." })).toBeInViewport({ timeout: 5_000 });
  expect(errors).toEqual([]);
});

test("YouTube page CTAs lead to the public audit page", async ({ page }) => {
  await page.goto("youtube/");
  for (const name of ["Check my channel", "Check my channel for free"]) {
    await expect(page.getByRole("link", { name, exact: true })).toHaveAttribute("href", "https://air.io/features/youtube-channel-audit");
  }
});
