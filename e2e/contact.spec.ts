import { expect, test, type Page } from "@playwright/test";
import { CONTACT_WORKER, mockWorker, stubTurnstile } from "./helpers";

const fill = async (page: Page, email = "ana@example.com") => {
  await page.getByLabel("Your name").fill("Ana");
  await page.getByLabel("Your email").fill(email);
  await page.getByLabel("Your message").fill("Hello there");
};
const send = (page: Page) => page.getByRole("button", { name: "Send message →" }).click();

test("the browser blocks empty and malformed fields", async ({ page }) => {
  await stubTurnstile(page);
  const posted = await mockWorker(page, CONTACT_WORKER, { body: { success: true } });
  await page.goto("/contact");
  await send(page);
  expect(await page.getByLabel("Your name").evaluate((el: HTMLInputElement) => el.validity.valueMissing)).toBe(true);
  await fill(page, "not-an-email");
  await send(page);
  expect(await page.getByLabel("Your email").evaluate((el: HTMLInputElement) => el.validity.typeMismatch)).toBe(true);
  await expect(page.getByRole("button", { name: "Verifying…" })).toHaveCount(0);
  expect(posted).toHaveLength(0);
});

test("a message goes to the worker", async ({ page }) => {
  await stubTurnstile(page);
  const posted = await mockWorker(page, CONTACT_WORKER, { body: { success: true, id: "e1" } });
  await page.goto("/contact");
  await fill(page);
  await send(page);
  await expect(page.getByText("Message sent, I'll get back to you soon.")).toBeVisible();
  expect(posted[0].postDataJSON()).toEqual({ name: "Ana", email: "ana@example.com", message: "Hello there", turnstileToken: "fake-token" });
  await page.getByRole("button", { name: "Send another" }).click();
  await expect(page.getByLabel("Your name")).toHaveValue("");
});

test("a worker failure shows an error", async ({ page }) => {
  await stubTurnstile(page);
  await mockWorker(page, CONTACT_WORKER, { status: 502, body: { success: false, stage: "resend" } });
  await page.goto("/contact");
  await fill(page);
  await send(page);
  await expect(page.getByText("Something went wrong, please try again.")).toBeVisible();
  await expect(page.getByLabel("Your message")).toHaveValue("Hello there");
});

test("the access code gate", async ({ page }) => {
  await page.goto("/contact");
  const code = page.getByLabel("Access code");
  const unlock = page.getByRole("button", { name: "Unlock" });
  await expect(unlock).toBeDisabled();
  await code.fill("apple");
  await unlock.click();
  await expect(page.getByText("Invalid code.")).toBeVisible();
  await code.fill("banana");
  await code.press("Enter");
  await expect(page.getByRole("link", { name: "nottodaybot@gmail.com" })).toHaveAttribute("href", "mailto:nottodaybot@gmail.com");
  await expect(page.getByRole("link", { name: "+45 12 34 56 78" })).toHaveAttribute("href", "tel:+4512345678");
  await expect(page.getByText("Invalid code.")).toHaveCount(0);
});
