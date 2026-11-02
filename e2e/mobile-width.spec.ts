import { expect, test } from "@playwright/test";
import { projects } from "../app/data/portfolio";
import { posts } from "../app/data/blog";

const PATHS = ["/", "/about", "/resume", "/sports", "/blog", "/contact", "/portfolio", `/blog/${posts.find((p) => !p.draft)!.slug}`, ...projects.map((p) => `/portfolio/${p.slug}`)];

// a phone browser widens the layout to fit anything too wide and zooms the page out
for (const path of PATHS) {
  test(`${path} fits a phone`, async ({ page, isMobile, viewport }) => {
    test.skip(!isMobile, "phones only");
    await page.goto(path);
    await page.waitForLoadState("load");
    // walk down the page so lazy media mounts, the widest things load late
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += 500) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      await page.waitForTimeout(50);
    }
    await expect.poll(() => page.evaluate(() => [window.innerWidth, document.documentElement.scrollWidth])).toEqual([viewport!.width, viewport!.width]);
  });
}

test("a swipe on a diagram scrolls it and the page", async ({ page, isMobile, context }) => {
  test.skip(!isMobile, "phones only");
  await page.goto("/portfolio/ragnaduds");
  const flow = page.locator(".react-flow").first();
  await flow.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(500);
  const scroller = page.locator("div.overflow-x-auto:has(.react-flow)").first();
  const cdp = await context.newCDPSession(page);
  const swipe = async (dx: number, dy: number) => {
    const [x, y] = [dx ? 300 : 100, 450];
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    for (let i = 1; i <= 10; i++) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + (dx * i) / 10, y: y + (dy * i) / 10 }] });
      await page.waitForTimeout(16);
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await page.waitForTimeout(200);
  };

  await swipe(-200, 0);
  expect(await scroller.evaluate((el) => el.scrollLeft)).toBeGreaterThan(50);

  const before = await page.evaluate(() => window.scrollY);
  await swipe(0, -200);
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(before + 50);
});
