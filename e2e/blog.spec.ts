import { expect, test } from "@playwright/test";
import { posts } from "../app/data/blog";
import { COMMENTS_WORKER, mockWorker, stubTurnstile } from "./helpers";

const published = posts.filter((p) => !p.draft);

test("the list shows published posts only, newest first", async ({ page }) => {
  await page.goto("/blog");
  await expect(page.locator("article h2")).toHaveText(published.map((p) => p.title));
  for (const p of posts.filter((x) => x.draft)) await expect(page.getByText(p.title)).toHaveCount(0);
  await page.getByRole("link", { name: published[0].title }).click();
  await expect(page).toHaveURL(`/blog/${published[0].slug}`);
});

test("a post renders its text and images", async ({ page }) => {
  const post = published.find((p) => p.content.includes("!["))!;
  await page.goto(`/blog/${post.slug}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(post.title);
  expect(await page.locator("main p.indent-8").count()).toBeGreaterThan(0);
  const images = page.locator("main .space-y-4 img");
  const count = await images.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const img = images.nth(i);
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  }
});

test("prev and next skip drafts", async ({ page }) => {
  const i = 1;
  await page.goto(`/blog/${published[i].slug}`);
  await expect(page.getByRole("link", { name: /← Prev/ })).toContainText(published[i - 1].title);
  await page.getByRole("link", { name: /Next →/ }).click();
  await expect(page).toHaveURL(`/blog/${published[i + 1].slug}`);
  await page.goto(`/blog/${published[0].slug}`);
  await expect(page.getByRole("link", { name: /← Prev/ })).toHaveCount(0);
  await page.goto(`/blog/${published.at(-1)!.slug}`);
  await expect(page.getByRole("link", { name: /Next →/ })).toHaveCount(0);
});

test.describe("comments", () => {
  const slug = published[0].slug;

  test("validates before verifying", async ({ page }) => {
    await stubTurnstile(page);
    const posted = await mockWorker(page, COMMENTS_WORKER, { body: { success: true } });
    await page.goto(`/blog/${slug}`);
    await page.getByRole("button", { name: "Leave a comment →" }).click();
    const send = page.getByRole("button", { name: "Send comment →" });
    await send.click();
    await expect(page.getByText("A name, or something to call you.")).toBeVisible();
    await page.getByPlaceholder("Your name").fill("Ana");
    await page.getByPlaceholder("Your comment").fill("!!");
    await send.click();
    await expect(page.getByText("Write a comment first.")).toBeVisible();
    expect(posted).toHaveLength(0);
  });

  test("sends to the worker and thanks", async ({ page }) => {
    await stubTurnstile(page);
    const posted = await mockWorker(page, COMMENTS_WORKER, { body: { success: true, url: "https://github.com/x/pull/1" } });
    await page.goto(`/blog/${slug}`);
    await page.getByRole("button", { name: "Leave a comment →" }).click();
    await page.getByPlaceholder("Your name").fill("Ana");
    await page.getByPlaceholder("Your comment").fill("Lovely post");
    await page.getByRole("button", { name: "Send comment →" }).click();
    await expect(page.getByText("Thanks, your comment reached me.")).toBeVisible();
    expect(posted).toHaveLength(1);
    expect(posted[0].postDataJSON()).toEqual({ slug, name: "Ana", message: "Lovely post", website: "", turnstileToken: "fake-token" });
  });

  test("a worker error is shown and the form stays", async ({ page }) => {
    await stubTurnstile(page);
    await mockWorker(page, COMMENTS_WORKER, { status: 400, body: { success: false, error: "invalid_fields" } });
    await page.goto(`/blog/${slug}`);
    await page.getByRole("button", { name: "Leave a comment →" }).click();
    await page.getByPlaceholder("Your name").fill("Ana");
    await page.getByPlaceholder("Your comment").fill("Lovely post");
    await page.getByRole("button", { name: "Send comment →" }).click();
    await expect(page.getByText("Something went wrong, please try again.")).toBeVisible();
    await expect(page.getByPlaceholder("Your comment")).toHaveValue("Lovely post");
  });
});
