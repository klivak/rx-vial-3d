import { defineConfig, devices } from "@playwright/test";

// Smoke tests run against the static export served under the GitHub Pages basePath, i.e. exactly what gets deployed.
// WebGL comes from SwiftShader, so this checks that the scene boots, not how it looks.
const webgl = { launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } };

export default defineConfig({
  testDir: "tests",
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: { baseURL: "http://localhost:4173/rx-vial-3d/", trace: "retain-on-failure" },
  webServer: { command: "node scripts/serve-out.mjs", url: "http://localhost:4173/rx-vial-3d/", reuseExistingServer: !process.env.CI },
  projects: [
    { name: "android", use: { ...devices["Pixel 7"], ...webgl } },
    { name: "iphone", use: { ...devices["iPhone 14"], browserName: "chromium", ...webgl } },
    { name: "reduced-motion", use: { ...devices["Pixel 7"], ...webgl, contextOptions: { reducedMotion: "reduce" } } },
    { name: "desktop", use: { viewport: { width: 1440, height: 900 }, ...webgl } },
  ],
});
