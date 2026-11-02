import { defineConfig, devices } from "@playwright/test";

const PORT = 3103;
// software webgl so the mundo globe renders headless
const args = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  // software webgl saturates the cpu, more workers starve the other pages
  workers: 2,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // the globe and physics pages are heavy, a busy machine needs slack
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    launchOptions: { args },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], launchOptions: { args } } },
    { name: "mobile", use: { ...devices["Pixel 7"], launchOptions: { args } } },
  ],
  webServer: {
    command: `bun run build && bun e2e/serve.ts`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: { PORT: String(PORT) },
  },
});
