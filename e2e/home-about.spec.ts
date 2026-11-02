import { expect, test } from "@playwright/test";
import blog from "../content/blog.json";
import { formatDmyDate, posts } from "../app/data/blog";
import { intro, now } from "../app/data/about";

test.describe("home", () => {
  test("nav cards carry live stats", async ({ page }) => {
    await page.goto("/");
    for (const label of ["About", "Resume", "Portfolio", "Mundo", "Sports", "Blog", "Contact"]) {
      await expect(page.locator("a.nav-card").filter({ has: page.getByText(label, { exact: true }) })).toHaveCount(1);
    }
    await expect(page.locator("a.nav-card[href='/about']")).toContainText(`${now[0].entries.length} things going on right now`);
    const published = blog.filter((p) => !p.draft).length;
    await expect(page.locator("a.nav-card[href='/blog']")).toContainText(`${published} posts`);
  });

  test("latest writing lists only published posts", async ({ page }) => {
    await page.goto("/");
    const section = page.locator("section").filter({ has: page.getByRole("heading", { name: "Latest writing" }) });
    const expected = posts.filter((p) => !p.draft).slice(0, 3);
    await expect(section.getByRole("listitem")).toHaveCount(expected.length);
    for (const p of expected) await expect(section.getByRole("link", { name: p.title })).toHaveAttribute("href", `/blog/${p.slug}`);
    for (const p of posts.filter((x) => x.draft)) await expect(section).not.toContainText(p.title);
    await section.getByRole("link", { name: "See all posts" }).click();
    await expect(page).toHaveURL("/blog");
  });
});

test.describe("about", () => {
  test("photo, intro, snapshot lists", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByRole("heading", { level: 1, name: "About" })).toBeVisible();
    const photo = page.getByRole("img", { name: /indoor waterfall/ });
    await expect(photo).toBeVisible();
    expect(await photo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    await expect(page.getByText(intro.slice(0, 40))).toBeVisible();
    await expect(page.getByText("Last updated:")).toContainText(formatDmyDate(now[0].date));

    const current = page.locator("section").filter({ has: page.getByRole("heading", { name: "Currently" }) });
    await expect(current.getByRole("listitem")).toHaveCount(now[0].entries.length);
    const previously = page.locator("section").filter({ has: page.getByRole("heading", { name: "Previously" }) });
    await expect(previously.getByRole("listitem")).toHaveCount(now.slice(1).reduce((n, s) => n + s.entries.length, 0));
  });

  test("asides reveal their notes", async ({ page, isMobile }) => {
    await page.goto("/about");
    for (const [label, text] of [["people", "Ronaldinho Gaúcho"], ["gaúchos", "horsemen of the Pampas"]]) {
      const trigger = page.getByText(label, { exact: true });
      const tip = page.getByRole("tooltip").filter({ hasText: text });
      await expect(tip).toHaveCSS("opacity", "0");
      if (isMobile) await trigger.focus();
      else await trigger.hover();
      await expect(tip).toHaveCSS("opacity", "1");
      await page.locator("h1").click();
      if (isMobile) await trigger.blur();
    }
  });

  test("external links open a new tab, internal ones navigate", async ({ page }) => {
    await page.goto("/about");
    const pedal = page.getByRole("link", { name: "MMH-MP" });
    await expect(pedal).toHaveAttribute("href", /^https:\/\/github\.com\/dudustri\//);
    await expect(pedal).toHaveAttribute("target", "_blank");
    const emu = page.locator("section").filter({ has: page.getByRole("heading", { name: "Currently" }) }).getByRole("link", { name: "Game Boy Color emulator" });
    await expect(emu).toHaveAttribute("href", "https://github.com/dudustri/rustboy-color");
    await expect(emu).toHaveAttribute("target", "_blank");

    for (const [name, path] of [["Mundo", "/mundo"], ["Sports", "/sports"], ["here", "/contact"], ["RagnaDuds", "/portfolio/ragnaduds"]] as const) {
      await page.goto("/about");
      const link = page.locator("main").getByRole("link", { name, exact: true }).first();
      expect(await link.getAttribute("target")).toBeNull();
      await link.click();
      await expect(page).toHaveURL(path);
    }
  });
});
