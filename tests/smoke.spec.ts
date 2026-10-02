import { expect, test, type Page } from "@playwright/test";

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  return errors;
}

test("page boots: text first, then the 3D scene, without errors", async ({ page }, testInfo) => {
  const errors = collectErrors(page);
  await page.goto("vial/");

  await expect(page.getByRole("heading", { level: 1, name: "Care that comes to you." })).toBeVisible();
  await expect(page.locator("#scene-layer canvas")).toBeAttached({ timeout: 20_000 });
  // The loader holds the page until the first frame; scrolling before that would be pinned back to the top.
  await expect(page.locator("html")).not.toHaveClass(/is-loading/, { timeout: 10_000 });

  // The call to action is the last scroll frame; the details section follows it at the very bottom of the page.
  await page.locator('[data-frame="cta"]').scrollIntoViewIfNeeded();
  const start = page.getByRole("button", { name: "Start your visit" });
  await expect(start).toBeInViewport();
  await start.click();
  await expect(page.getByText("Demo only: no visit is booked.")).toBeVisible();
  await page.waitForTimeout(1500);
  await testInfo.attach("last-frame", { body: await page.screenshot(), contentType: "image/png" });

  // On phones the details section is taller than the screen, so go to its heading rather than the bottom of the page.
  const details = page.getByRole("heading", { level: 2, name: "Everything inside the vial, and around it." });
  await details.scrollIntoViewIfNeeded();
  await expect(details).toBeInViewport();

  expect(errors).toEqual([]);
});

test("every frame has a real heading for screen readers", async ({ page }) => {
  await page.goto("vial/");
  // SplitWords puts a space inside every word mask, so compare text with whitespace collapsed.
  const headings = (await page.getByRole("heading", { level: 2 }).allTextContents()).map((t) => t.replace(/\s+/g, " ").trim());
  expect(headings).toEqual([
    "Clinically backed formula",
    "How it works",
    "Discreet packaging, tracked delivery.",
    "Ready when you are.",
    "Everything inside the vial, and around it.",
  ]);
  await expect(page.locator("#scene-layer")).toHaveAttribute("aria-hidden", "true");
});

test("cap colour picker works from the keyboard and lands in the URL", async ({ page }) => {
  await page.goto("vial/");
  const group = page.getByRole("radiogroup", { name: "Cap colour" });
  await group.getByRole("radio", { name: "Sage" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(group.getByRole("radio", { name: "Ivory" })).toHaveAttribute("aria-checked", "true");
  await expect(group.getByRole("radio", { name: "Ivory" })).toBeFocused();
  expect(page.url()).toContain("#cap=ivory");
});

test("AR models for every cap colour are deployed", async ({ request }) => {
  for (const cap of ["sage", "ivory", "graphite"]) {
    for (const ext of ["glb", "usdz"]) {
      const res = await request.get(`models/vial-${cap}.${ext}`);
      expect(res.status(), `${cap}.${ext}`).toBe(200);
    }
  }
});
