import { expect, test } from "@playwright/test";
import { posts } from "../app/data/blog";

const published = posts.filter((p) => !p.draft);
const drafts = posts.filter((p) => p.draft);

test.describe("files", () => {
  test.skip(({ isMobile }) => isMobile, "plain http, one project is enough");

  test("sitemap lists pages and published posts only", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    expect(xml).toContain("<loc>https://eduardo.dk/about</loc>");
    for (const p of published) expect(xml).toContain(`<loc>https://eduardo.dk/blog/${p.slug}</loc>`);
    for (const p of drafts) expect(xml).not.toContain(`/blog/${p.slug}<`);
  });

  test("feed is valid rss with published posts only", async ({ request, page }) => {
    const res = await request.get("/feed.xml");
    expect(res.ok()).toBe(true);
    const xml = await res.text();
    const parsed = await page.evaluate((src) => {
      const doc = new DOMParser().parseFromString(src, "application/xml");
      return {
        error: doc.querySelector("parsererror")?.textContent ?? null,
        links: [...doc.querySelectorAll("item > link")].map((l) => l.textContent),
      };
    }, xml);
    expect(parsed.error).toBeNull();
    expect(parsed.links).toEqual(published.map((p) => `https://eduardo.dk/blog/${p.slug}`));
  });

  test("robots and llms.txt", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Allow: /");
    expect(robots).toContain("Sitemap: https://eduardo.dk/sitemap.xml");
    const llms = await (await request.get("/llms.txt")).text();
    expect(llms.length).toBeGreaterThan(500);
    expect(llms.startsWith("# Eduardo Sfreddo Trindade")).toBe(true);
  });

  test("icon links resolve", async ({ page, request }) => {
    await page.goto("/");
    const hrefs = await page.locator('head link[rel="icon"]').evaluateAll((ls) => ls.map((l) => l.getAttribute("href")!));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) expect((await request.get(href)).ok()).toBe(true);
  });
});

const MAIN = ["/", "/about", "/resume", "/portfolio", "/sports", "/blog", "/contact", `/blog/${published[0].slug}`, "/portfolio/ragnaduds"];

test.describe("accessibility smoke", () => {
  for (const path of MAIN) {
    test(`${path} has one h1 and no image without alt`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("img:not([alt])")).toHaveCount(0);
    });
  }

  test("/mundo has one h1", async ({ page }) => {
    await page.goto("/mundo");
    await expect(page.locator("h1")).toHaveCount(1);
  });
});
