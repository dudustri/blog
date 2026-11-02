import { expect, test } from "@playwright/test";
import { projects } from "../app/data/portfolio";
import { ragnadudsFlow } from "../app/data/ragnadudsFlow";

test("the list shows every project with wip badges", async ({ page }) => {
  await page.goto("/portfolio");
  const cards = page.locator("a.nav-card");
  await expect(cards).toHaveCount(projects.length);
  for (const p of projects) {
    const card = page.locator(`a.nav-card[href="/portfolio/${p.slug}"]`);
    await expect(card.getByRole("heading", { level: 2 })).toHaveText(p.title);
    await expect(card.getByText("To be done")).toHaveCount(p.wip ? 1 : 0);
  }
  await page.locator('a.nav-card[href="/portfolio/ragnaduds"]').click();
  await expect(page).toHaveURL("/portfolio/ragnaduds");
});

test.describe("a project page", () => {
  const project = projects.find((p) => p.slug === "ragnaduds")!;

  test.beforeEach(async ({ page }) => {
    await page.goto("/portfolio/ragnaduds");
  });

  test("hero, intro link and tech chips", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 }).first()).toHaveText(project.title.split(" - ")[0]);
    const intro = page.locator("main p").filter({ hasText: "You can check it live" });
    const here = intro.getByRole("link", { name: "here" });
    await expect(here).toHaveAttribute("href", "https://ragnaduds.duckdns.org");
    await expect(here).toHaveAttribute("target", "_blank");
    for (const t of project.tech) await expect(page.locator("main span.rounded").getByText(t, { exact: true }).first()).toBeVisible();
  });

  test("diagram nodes show their details, the background clears them", async ({ page }) => {
    const flows = page.locator(".react-flow");
    await expect(flows).toHaveCount(3);
    const first = page.locator("figure").filter({ has: page.locator(".react-flow") }).first();
    await first.scrollIntoViewIfNeeded();
    const node = ragnadudsFlow.nodes.find((n) => n.id === "friends")!;
    const detail = ragnadudsFlow.details.friends;
    await expect(first.locator(".react-flow__node")).toHaveCount(ragnadudsFlow.nodes.length);
    await first.locator(".react-flow__node").filter({ hasText: String(node.data.label) }).click();
    await expect(first.getByText(detail.title, { exact: true })).toBeVisible();
    await expect(first.getByText(detail.what)).toBeVisible();
    await first.locator(".react-flow__pane").click({ position: { x: 4, y: 4 } });
    await expect(first.getByText(detail.title, { exact: true })).toHaveCount(0);
  });

  test("diagram info tooltip", async ({ page, isMobile }) => {
    const icon = page.getByRole("button", { name: "How the diagram works" }).first();
    const tip = page.getByRole("tooltip").filter({ hasText: "Click any box" }).first();
    await icon.scrollIntoViewIfNeeded();
    await expect(tip).toHaveCSS("opacity", "0");
    if (isMobile) await icon.focus();
    else await icon.hover();
    await expect(tip).toHaveCSS("opacity", "1");
  });

  test("images and clips load, clips have no picture in picture", async ({ page }) => {
    const figures = page.locator("figure:has(figcaption)").filter({ hasNot: page.locator(".react-flow") });
    const count = await figures.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const fig = figures.nth(i);
      await fig.scrollIntoViewIfNeeded();
      await expect(fig.getByRole("status", { name: "Loading" })).toHaveCount(0, { timeout: 20_000 });
      const media = fig.locator("img, video");
      await expect(media).toHaveCount(1);
      if ((await media.evaluate((el) => el.tagName)) === "VIDEO") {
        await expect(media).toHaveJSProperty("disablePictureInPicture", true);
        expect(await media.evaluate((v: HTMLVideoElement) => v.readyState)).toBeGreaterThanOrEqual(2);
      } else {
        expect(await media.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
      }
    }
  });

  test("the closing callout links to the join page", async ({ page }) => {
    const callout = page.locator("p.border-2").last();
    await expect(callout).toContainText("You are welcome to join");
    await expect(callout.getByRole("link", { name: "here" })).toHaveAttribute("href", "https://ragnaduds.duckdns.org/join");
  });
});

test("a wip project says it is still to be done", async ({ page }) => {
  const wip = projects.find((p) => p.wip)!;
  await page.goto(`/portfolio/${wip.slug}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(wip.title);
  await expect(page.getByText("This project write-up is still to be done")).toBeVisible();
});
