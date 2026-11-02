import { expect, test } from "@playwright/test";
import { experience, jobMatches } from "../app/data/resume";
import { careerDigest } from "../app/data/digest";

const roles = (picks: string[]) => experience.filter((j) => jobMatches(j, picks)).length;

test.beforeEach(async ({ page }) => {
  await page.goto("/resume");
});

test("tabs and rows toggle per section", async ({ page }) => {
  const tech = page.locator("#techstack");
  const eng = page.locator("#engineeringstack");
  await expect(tech.getByRole("tablist")).toBeVisible();
  await tech.getByRole("button", { name: "Rows", exact: true }).click();
  await expect(tech.getByRole("button", { name: "Rows", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(tech.getByRole("tablist")).toHaveCount(0);
  await expect(tech.getByText("Databases", { exact: true })).toBeVisible();
  await expect(tech.getByRole("button", { name: "PostgreSQL" })).toBeVisible();
  // the other section keeps its own layout
  await expect(eng.getByRole("tablist")).toBeVisible();
  await tech.getByRole("button", { name: "Tabs", exact: true }).click();
  await expect(tech.getByRole("tablist")).toBeVisible();
});

test("switching tabs swaps the chips", async ({ page }) => {
  const tech = page.locator("#techstack");
  await expect(tech.getByRole("tab", { name: "Languages" })).toHaveAttribute("aria-selected", "true");
  await expect(tech.getByRole("tabpanel").getByRole("button", { name: "Rust" })).toBeVisible();
  await tech.getByRole("tab", { name: "Databases" }).click();
  await expect(tech.getByRole("tab", { name: "Databases" })).toHaveAttribute("aria-selected", "true");
  await expect(tech.getByRole("tabpanel").getByRole("button", { name: "PostgreSQL" })).toBeVisible();
  await expect(tech.getByRole("tabpanel").getByRole("button", { name: "Rust" })).toHaveCount(0);
});

test("picking skills counts, highlights roles and clears", async ({ page }) => {
  const tech = page.locator("#techstack");
  const eng = page.locator("#engineeringstack");
  const total = experience.length;

  await tech.getByRole("button", { name: "Rust", exact: true }).click();
  await expect(tech.getByRole("button", { name: "Rust", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(tech.getByText(`1 selected · ${roles(["Rust"])} of ${total} roles`)).toBeVisible();

  for (const job of experience) {
    await expect(page.locator(`[id="${job.id}"]`)).toHaveCSS("opacity", jobMatches(job, ["Rust"]) ? "1" : "0.2");
  }

  await eng.getByRole("button", { name: "Modbus", exact: true }).click();
  const both = roles(["Rust", "Modbus"]);
  await expect(eng.getByText(`1 selected · ${both} of ${total} roles`)).toBeVisible();
  await expect(tech.getByText(`1 selected · ${both} of ${total} roles`)).toBeVisible();
  await expect(tech.getByRole("tab", { name: "Languages" })).toContainText("· 1");

  // clear only drops this section's picks
  await eng.getByRole("button", { name: "Clear" }).click();
  await expect(eng.getByText(/selected ·/)).toHaveCount(0);
  await expect(tech.getByText(`1 selected · ${roles(["Rust"])} of ${total} roles`)).toBeVisible();
  await tech.getByRole("button", { name: "Clear" }).click();
  await expect(tech.getByText(/selected ·/)).toHaveCount(0);
  for (const job of experience) await expect(page.locator(`[id="${job.id}"]`)).toHaveCSS("opacity", "1");
});

test("a role opens its detail with the picked skills lit", async ({ page }) => {
  const job = experience.find((j) => j.stack?.includes("Rust"))!;
  await page.locator("#techstack").getByRole("button", { name: "Rust", exact: true }).click();
  await page.locator(`[id="${job.id}"]`).click();
  const modal = page.getByTestId("detail-modal");
  await expect(modal).toBeVisible();
  await expect(modal).toContainText(job.company);
  await expect(modal).toContainText(job.title);
  const chips = modal.locator("span.rounded.border");
  await expect(chips.getByText("Rust", { exact: true })).toHaveAttribute("style", /accent-fill/);
  await expect(chips.getByText("Docker", { exact: true })).not.toHaveAttribute("style", /accent-fill/);
  await modal.click({ position: { x: 3, y: 3 } });
  await expect(modal).toHaveCount(0);
});

test("the info icon explains the chips", async ({ page, isMobile }) => {
  const icon = page.locator("#techstack").getByRole("button", { name: "How the skills work" });
  const tip = page.locator("#techstack-info");
  await expect(tip).toHaveCSS("opacity", "0");
  if (isMobile) await icon.focus();
  else await icon.hover();
  await expect(tip).toHaveCSS("opacity", "1");
  await expect(tip).toHaveText("Click a skill to highlight the roles that used it.");
});

test("copy profile puts the plain digest on the clipboard", async ({ page, context, baseURL }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: baseURL });
  await page.getByRole("button", { name: "Copy profile for AI" }).click();
  await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text).toBe(careerDigest());
  expect(text).toContain("## Experience");
  expect(text).not.toMatch(/\[[^\]]+\]\([^)]+\)/);
});
