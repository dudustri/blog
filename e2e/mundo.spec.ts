import { expect, test, type Page } from "@playwright/test";
import { countries } from "../app/data/mundo";

const SPEEDS = ["Faster", "Even Faster", "Are You Nuts?!", "I'm Calling the Police", "Intergalactical Police", "Gravity Distortion"];

// software webgl is slow, so fewer pixels and one globe per test
test.use({ deviceScaleFactor: 1 });
test.describe.configure({ mode: "serial", timeout: 300_000 });

// frames can take seconds under software webgl, so the actionability checks never settle
const tap = (page: Page, name: string) => page.getByRole("button", { name, exact: true }).dispatchEvent("click");

async function openGlobe(page: Page) {
  await page.goto("/mundo");
  await expect(page.getByText("spinning up the world…")).toBeHidden({ timeout: 150_000 });
  // a slow boot can show the no-webgl note for a moment before the globe is ready
  await expect(page.getByText(/needs WebGL/)).toBeHidden({ timeout: 150_000 });
  await expect(page.locator("canvas")).toBeVisible();
}

async function startQuiz(page: Page) {
  // the top spin level, where the quiz lives, survives a quit
  if (!(await page.getByRole("button", { name: "Guess the Country" }).count())) for (const label of SPEEDS) await tap(page, label);
  await tap(page, "Guess the Country");
  await expect(page.getByPlaceholder("country name…")).toBeVisible();
  await expect(page.getByText("round 1 · next +1 pts")).toBeVisible();
}

const idle = (page: Page) => page.locator("main").getByText("Mundo", { exact: true });

test("globe, continents and the country lists", async ({ page }) => {
  await openGlobe(page);
  await expect(idle(page)).toBeVisible();

  await tap(page, "Europe");
  await tap(page, "Spin");
  await expect(page.getByRole("button", { name: "Faster", exact: true })).toBeVisible();

  await tap(page, "Visited");
  const list = page.locator("main span.font-semibold");
  for (const c of countries) await expect(list.filter({ hasText: new RegExp(`^${c}`) }).first()).toBeAttached();
  await tap(page, "Visited");
  await expect(idle(page)).toBeVisible();
});

test("the quiz ends on a wrong guess and quitting stays quit", async ({ page }) => {
  await openGlobe(page);
  const gameOver = page.getByText(/^wrong, it was /);

  await startQuiz(page);
  await page.getByPlaceholder("country name…").fill("zzzzzz");
  await page.keyboard.press("Enter");
  await expect(gameOver).toBeVisible();
  await tap(page, "quit");
  await expect(idle(page)).toBeVisible();

  // regression: quit before the 900 ms game over timer fires, it must not bring the panel back
  await startQuiz(page);
  await page.getByPlaceholder("country name…").fill("zzzzzz");
  await page.keyboard.press("Enter");
  await tap(page, "Quit game");
  await page.waitForTimeout(1500);
  await expect(gameOver).toHaveCount(0);
  await expect(page.getByRole("button", { name: "play again" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Quit game" })).toHaveCount(0);
  await expect(idle(page)).toBeVisible();
});
