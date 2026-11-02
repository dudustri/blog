import type { Page, Request } from "@playwright/test";

export const COMMENTS_WORKER = "https://blog-comments.eduardostrindade.workers.dev";
export const CONTACT_WORKER = "https://blog-contact.eduardostrindade.workers.dev";

// a turnstile that passes at once with a fake token
export async function stubTurnstile(page: Page) {
  await page.route("https://challenges.cloudflare.com/turnstile/v0/api.js*", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `window.turnstile = {
        render: function (el, o) { setTimeout(function () { o.callback("fake-token"); }, 0); return "w1"; },
        reset: function () {},
      };`,
    }),
  );
}

// answers the worker (and its cors preflight) with a fixed body, collects what was posted
export async function mockWorker(page: Page, url: string, reply: { status?: number; body: unknown }) {
  const posted: Request[] = [];
  const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
  await page.route(url, (route) => {
    const req = route.request();
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
    posted.push(req);
    return route.fulfill({ status: reply.status ?? 200, headers: cors, contentType: "application/json", body: JSON.stringify(reply.body) });
  });
  return posted;
}
