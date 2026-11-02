import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import worker from "../workers/contact-worker.js";

const WORKER = "https://blog-contact.example.workers.dev";
type Call = { url: string; method: string; headers: Headers; body: string };
let calls: Call[];
let turnstileOk: boolean;
let resend: () => Response;
const realFetch = globalThis.fetch;

const env = (extra: Record<string, unknown> = {}) => ({
  TO_EMAIL: "inbox@example.com",
  TURNSTILE_SECRET: "ts-secret",
  RESEND_API_KEY: "re-secret",
  ...extra,
});

beforeEach(() => {
  calls = [];
  turnstileOk = true;
  resend = () => new Response(JSON.stringify({ id: "email-1" }), { status: 200 });
  globalThis.fetch = (async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = String(input);
    const body = init.body instanceof URLSearchParams ? init.body.toString() : String(init.body ?? "");
    calls.push({ url, method: init.method ?? "GET", headers: new Headers(init.headers), body });
    if (url.includes("siteverify")) return new Response(JSON.stringify({ success: turnstileOk }));
    if (url === "https://api.resend.com/emails") return resend();
    return new Response("unexpected", { status: 500 });
  }) as typeof fetch;
  spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  globalThis.fetch = realFetch;
});

const good = { name: "Ana", email: "ana@example.com", message: "Hello there", turnstileToken: "tok" };
const post = (body: unknown, raw = false) =>
  new Request(WORKER, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://eduardo.dk", "CF-Connecting-IP": "198.51.100.4" },
    body: raw ? (body as string) : JSON.stringify(body),
  });
async function send(req: Request, e = env()) {
  const res: Response = await worker.fetch(req, e);
  const text = await res.text();
  let body: Record<string, unknown> | null = null;
  try { body = JSON.parse(text); } catch { /* html or plain text */ }
  return { res, text, body };
}

describe("cors and methods", () => {
  test("preflight allows only the site", async () => {
    const res = await worker.fetch(new Request(WORKER, { method: "OPTIONS" }), env());
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://eduardo.dk");
    expect(res.headers.get("Access-Control-Allow-Methods")).toBe("POST, OPTIONS");
  });

  test("GET shows a harmless page", async () => {
    const { res, text } = await send(new Request(WORKER));
    expect(res.status).toBe(200);
    expect(text).toContain("Nothing to do here");
    expect(calls).toHaveLength(0);
  });

  test("other methods are 405", async () => {
    const { res } = await send(new Request(WORKER, { method: "PUT", body: "{}" }));
    expect(res.status).toBe(405);
  });
});

describe("validation", () => {
  test("rate limited by client ip", async () => {
    const keys: string[] = [];
    const limiter = { limit: async ({ key }: { key: string }) => (keys.push(key), { success: false }) };
    const { res, body } = await send(post(good), env({ RATE_LIMITER: limiter }));
    expect(res.status).toBe(429);
    expect(body?.error).toBe("rate_limited");
    expect(keys).toEqual(["198.51.100.4"]);
    expect(calls).toHaveLength(0);
  });

  const bad: [string, Record<string, unknown>][] = [
    ["no name", { name: "  " }],
    ["no message", { message: "" }],
    ["bad email", { email: "not-an-email" }],
    ["email with a header injection", { email: "ana@example.com\nBcc: x@y.z" }],
    ["email with spaces", { email: "ana @example.com" }],
    ["non string fields", { name: 1, email: {}, message: [] }],
  ];
  for (const [label, patch] of bad) {
    test(label, async () => {
      const { res, body } = await send(post({ ...good, ...patch }));
      expect(res.status).toBe(400);
      expect(body).toEqual({ success: false, error: "invalid_fields" });
      expect(calls).toHaveLength(0);
    });
  }

  test("missing token", async () => {
    const { res, body } = await send(post({ ...good, turnstileToken: "" }));
    expect(res.status).toBe(400);
    expect(body?.success).toBe(false);
    expect(calls).toHaveLength(0);
  });

  test("missing config fails closed without calling out", async () => {
    for (const key of ["TURNSTILE_SECRET", "RESEND_API_KEY", "TO_EMAIL"]) {
      const { res } = await send(post(good), env({ [key]: undefined }));
      expect(res.status).toBe(500);
    }
    expect(calls).toHaveLength(0);
  });

  test("a failed challenge sends nothing", async () => {
    turnstileOk = false;
    const { res, body } = await send(post(good));
    expect(res.status).toBe(400);
    expect(body?.stage).toBe("siteverify");
    const form = new URLSearchParams(calls[0].body);
    expect(form.get("secret")).toBe("ts-secret");
    expect(form.get("response")).toBe("tok");
    expect(form.get("remoteip")).toBe("198.51.100.4");
    expect(calls.some((c) => c.url.includes("resend"))).toBe(false);
  });
});

describe("errors do not leak", () => {
  test("a resend failure hides its response", async () => {
    resend = () => new Response('{"message":"key re-secret is invalid"}', { status: 401 });
    const { res, text } = await send(post(good));
    expect(res.status).toBe(502);
    expect(JSON.parse(text)).toEqual({ success: false, stage: "resend" });
  });

  test("broken json is a generic 500", async () => {
    const { res, text } = await send(post("{oops", true));
    expect(res.status).toBe(500);
    expect(JSON.parse(text)).toEqual({ success: false, stage: "outer" });
  });

  test("a network error is a generic 500", async () => {
    resend = () => {
      throw new Error("socket hang up at 10.0.0.1");
    };
    const { res, text } = await send(post(good));
    expect(res.status).toBe(500);
    expect(text).not.toContain("10.0.0.1");
  });
});

describe("happy path", () => {
  test("sends one escaped email through resend", async () => {
    const { res, body } = await send(
      post({ ...good, name: "Ana <script>", message: "hi & <b>bye</b>\r\n\r\n\r\n\r\nend" }),
    );
    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true, id: "email-1" });
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://eduardo.dk");

    const email = calls.find((c) => c.url === "https://api.resend.com/emails")!;
    expect(email.method).toBe("POST");
    expect(email.headers.get("Authorization")).toBe("Bearer re-secret");
    const sent = JSON.parse(email.body);
    expect(sent.to).toBe("inbox@example.com");
    expect(sent.reply_to).toBe("ana@example.com");
    expect(sent.subject).toBe("[eduardo.dk] New message from Ana <script> <ana@example.com>");
    expect(sent.html).toContain("Ana &lt;script&gt;");
    expect(sent.html).toContain("hi &amp; &lt;b&gt;bye&lt;/b&gt;\n\nend");
    expect(sent.html).not.toContain("<script>");
  });

  test("long fields are capped", async () => {
    await send(post({ ...good, name: "N".repeat(200), message: "m".repeat(6000) }));
    const sent = JSON.parse(calls.find((c) => c.url.includes("resend"))!.body);
    expect(sent.subject).toContain(`from ${"N".repeat(80)} <`);
    expect(sent.html).toContain("m".repeat(5000) + "</pre>");
    expect(sent.html).not.toContain("m".repeat(5001));
  });
});
