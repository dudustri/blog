import { expect, test, type Page } from "@playwright/test";
import { activities, categoryOf, filterActivities, foodMenuFor, pizzaSummary, statsFor } from "../app/data/activities";

// a stat tile is a label paragraph followed by its value
const tile = (page: Page, label: string) => page.locator("p", { hasText: new RegExp(`^${label}$`) }).locator("xpath=following-sibling::p[1]");
const items = (page: Page) => page.locator("section ul.divide-y > li");

test.beforeEach(async ({ page }) => {
  await page.goto("/sports");
});

test("lifetime tiles match the data", async ({ page }) => {
  const life = statsFor(activities);
  await expect(tile(page, "Total sessions")).toHaveText(String(life.count));
  await expect(tile(page, "Distance moved")).toHaveText(`${Math.round(life.distanceKm).toLocaleString("en-US")} km`);
  await expect(tile(page, "Vertical climbed")).toHaveText(`${Math.round(life.elevationM).toLocaleString("en-US")} m`);
});

test("picking a menu item relabels and recounts the earned tile", async ({ page }) => {
  const menu = foodMenuFor(pizzaSummary(activities).calories);
  await expect(tile(page, "Margherita earned")).toHaveText(menu[0].earned.toLocaleString("en-US"));
  for (const name of ["Kebab", "Haribo", "Burger"]) {
    const item = page.getByRole("button").filter({ has: page.getByText(name, { exact: true }) });
    await item.click();
    await expect(item).toHaveAttribute("aria-pressed", "true");
    const earned = menu.find((m) => m.name === name)!.earned.toLocaleString("en-US");
    await expect(item.locator("span.flex-shrink-0 span")).toHaveText(earned);
    await expect(tile(page, `${name} earned`)).toHaveText(earned);
  }
});

test("the view switch toggles pizzas and activities", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "The menu" })).toBeVisible();
  await page.getByRole("button", { name: "Activities", exact: true }).click();
  await expect(page.getByRole("heading", { name: "The menu" })).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 2, name: "Running" })).toBeVisible();
  await page.getByRole("button", { name: "Pizzas Earned" }).click();
  await expect(page.getByRole("heading", { name: "The menu" })).toBeVisible();
});

test("year and month filters narrow the list", async ({ page }) => {
  await page.getByRole("button", { name: "Activities", exact: true }).click();
  const running = (y: number | "all", m: number | "all") => filterActivities(y, m).filter((a) => categoryOf(a) === "running");
  const sessions = page.locator("p", { hasText: /^Sessions$/ }).locator("xpath=following-sibling::p[1]");
  await expect(sessions).toHaveText(String(running("all", "all").length));

  await page.locator("select").first().selectOption("2025");
  await expect(sessions).toHaveText(String(running(2025, "all").length));
  for (const t of await items(page).allInnerTexts()) expect(t).toContain("2025");

  const month = [...Array(12).keys()].find((m) => running(2025, m).length > 0)!;
  await page.locator("select").nth(1).selectOption(String(month));
  await expect(sessions).toHaveText(String(running(2025, month).length));
  await expect(items(page)).toHaveCount(Math.min(10, running(2025, month).length));
});

test("the list pages by ten and loads all", async ({ page }) => {
  await page.getByRole("button", { name: "Activities", exact: true }).click();
  const total = filterActivities("all", "all").filter((a) => categoryOf(a) === "running").length;
  await expect(items(page)).toHaveCount(10);
  await page.getByRole("button", { name: `Load 10 more (${total - 10} left)` }).click();
  await expect(items(page)).toHaveCount(20);
  await page.getByRole("button", { name: `Load all ${total}` }).click();
  await expect(items(page)).toHaveCount(total);
  await expect(page.getByRole("button", { name: /^Load/ })).toHaveCount(0);
});

test("category tabs switch the panel", async ({ page }) => {
  await page.getByRole("button", { name: "Activities", exact: true }).click();
  const sessions = page.locator("p", { hasText: /^Sessions$/ }).locator("xpath=following-sibling::p[1]");
  for (const [label, key] of [["Swimming", "swimming"], ["Gym", "gym"], ["Others", "others"]] as const) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await expect(page.getByRole("heading", { level: 2, name: label })).toBeVisible();
    await expect(sessions).toHaveText(String(activities.filter((a) => categoryOf(a) === key).length));
  }
  await page.getByRole("button", { name: "Cycling", exact: true }).click();
  await page.locator("select").first().selectOption("2026");
  const cycling2026 = filterActivities(2026, "all").filter((a) => categoryOf(a) === "cycling").length;
  if (cycling2026 === 0) await expect(page.getByText("Nothing recorded in this range.")).toBeVisible();
  else await expect(sessions).toHaveText(String(cycling2026));
});
