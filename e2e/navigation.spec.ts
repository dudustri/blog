import { expect, test } from "@playwright/test";

const PAGES = [
  ["About", "/about"],
  ["Resume", "/resume"],
  ["Mundo", "/mundo"],
  ["Sports", "/sports"],
  ["Portfolio", "/portfolio"],
  ["Blog", "/blog"],
  ["Contact", "/contact"],
] as const;

test.describe("desktop header", () => {
  test.skip(({ isMobile }) => isMobile, "desktop nav is hidden on phones");

  test("links reach every page and mark it active", async ({ page }) => {
    test.slow();
    await page.goto("/");
    const nav = page.locator("header nav").first();
    await expect(nav.getByRole("link", { name: "Home" })).toHaveClass(/font-medium/);
    for (const [label, path] of PAGES) {
      await nav.getByRole("link", { name: label, exact: true }).click();
      await expect(page).toHaveURL(path);
      // the globe loader covers the header until it is ready
      if (path === "/mundo") await expect(page.getByText("spinning up the world…")).toBeHidden({ timeout: 90_000 });
      await expect(nav.getByRole("link", { name: label, exact: true })).toHaveClass(/font-medium/);
      await expect(nav.getByRole("link", { name: "Home" })).not.toHaveClass(/font-medium/);
    }
  });

  test("the name goes home", async ({ page }) => {
    await page.goto("/blog");
    await page.getByRole("link", { name: "Eduardo S. Trindade" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Eduardo Sfreddo Trindade");
  });
});

test.describe("mobile menu", () => {
  test.skip(({ isMobile }) => !isMobile, "the grid menu is phones only");

  test("opens, closes and navigates", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Toggle menu" });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    const grid = page.locator("header nav").last();
    await expect(grid.getByRole("link")).toHaveCount(PAGES.length + 1);
    await toggle.click();
    await expect(grid).toBeHidden();

    await toggle.click();
    await page.locator("header nav").last().getByRole("link", { name: "Sports" }).click();
    await expect(page).toHaveURL("/sports");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await expect(page.locator("header nav").last().getByRole("link", { name: "Sports" })).toHaveClass(/font-medium/);
  });
});

test("theme toggle sets dark and survives a reload", async ({ page }) => {
  await page.goto("/about");
  const html = page.locator("html");
  await expect(html).not.toHaveClass(/dark/);
  await page.getByRole("button", { name: "Switch to dark mode" }).filter({ visible: true }).click();
  await expect(html).toHaveClass(/dark/);
  expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe("dark");
  await page.reload();
  await expect(html).toHaveClass(/dark/);
  await page.getByRole("button", { name: "Switch to light mode" }).filter({ visible: true }).click();
  await expect(html).not.toHaveClass(/dark/);
  await page.reload();
  await expect(html).not.toHaveClass(/dark/);
});

test("unknown pages are 404", async ({ page }) => {
  const res = await page.goto("/no-such-page");
  expect(res?.status()).toBe(404);
  await expect(page.getByText("This page could not be found")).toBeVisible();
});

test("draft posts have no page", async ({ page }) => {
  const res = await page.goto("/blog/electric-guitar");
  expect(res?.status()).toBe(404);
  await expect(page.getByText("This page could not be found")).toBeVisible();
});
