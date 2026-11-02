import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import worker from "../workers/comments-worker.js";

const ORIGIN = "https://eduardo.dk";
const WORKER = "https://blog-comments.example.workers.dev";
const POSTS = [
  { id: "2026-03-15-aaaa", slug: "hello" },
  { id: "2026-03-16-bbbb", slug: "secret-draft", draft: true },
  { slug: "no-id" },
];

type Call = { url: string; method: string; headers: Headers; body: string };
let calls: Call[];
let pending: Promise<unknown>[];
// per test overrides, keyed by "METHOD url-substring"
let overrides: Record<string, () => Response>;
let cache: Map<string, Response>;
const realFetch = globalThis.fetch;

const env = (extra: Record<string, unknown> = {}) => ({
  GITHUB_OWNER: "dudustri",
  GITHUB_REPO: "blog",
  GITHUB_BRANCH: "main",
  ALLOWED_ORIGINS: `${ORIGIN}, http://localhost:3000`,
  SITE_URL: "https://eduardo.dk/",
  GITHUB_TOKEN: "gh-secret-token",
  TURNSTILE_SECRET: "ts-secret",
  ...extra,
});
const ctx = () => ({ waitUntil: (p: Promise<unknown>) => pending.push(p) });

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function route(method: string, url: string): Response {
  for (const [key, make] of Object.entries(overrides)) {
    const [m, part] = key.split(" ");
    if (m === method && url.includes(part)) return make();
  }
  if (url.includes("turnstile/v0/siteverify")) return json({ success: true });
  if (url.includes("/contents/content/blog.json")) return new Response(JSON.stringify(POSTS));
  if (url.includes("/git/ref/heads/main")) return json({ object: { sha: "base-sha" } });
  if (url.endsWith("/git/refs")) return json({ ref: "ok" }, 201);
  if (method === "PUT" && url.includes("/contents/content/comments/")) return json({}, 201);
  if (url.endsWith("/pulls")) return json({ number: 42, html_url: "https://github.com/dudustri/blog/pull/42" }, 201);
  if (url.includes("/labels")) return json({}, 200);
  return json({ message: "unexpected" }, 500);
}

beforeEach(() => {
  calls = [];
  pending = [];
  overrides = {};
  cache = new Map();
  globalThis.fetch = (async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = String(input instanceof Request ? input.url : input);
    const method = init.method ?? "GET";
    const body = init.body instanceof URLSearchParams ? init.body.toString() : String(init.body ?? "");
    calls.push({ url, method, headers: new Headers(init.headers), body });
    return route(method, url);
  }) as typeof fetch;
  (globalThis as unknown as { caches: unknown }).caches = {
    default: {
      match: async (req: Request) => cache.get(req.url)?.clone(),
      put: async (req: Request, res: Response) => void cache.set(req.url, res),
    },
  };
  spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  globalThis.fetch = realFetch;
});

const good = { slug: "hello", name: "Ana", message: "Lovely post, thanks!", turnstileToken: "tok", website: "" };
function post(body: unknown, { origin = ORIGIN, headers = {} as Record<string, string>, raw = false } = {}) {
  return new Request(WORKER, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin, "CF-Connecting-IP": "203.0.113.9", "CF-IPCountry": "DK", ...headers },
    body: raw ? (body as string) : JSON.stringify(body),
  });
}
async function send(req: Request, e = env()) {
  const res: Response = await worker.fetch(req, e, ctx());
  await Promise.all(pending);
  return { res, body: await res.json().catch(() => null) };
}
const ghCalls = () => calls.filter((c) => c.url.startsWith("https://api.github.com"));

describe("cors and methods", () => {
  test("preflight from an allowed origin gets cors headers", async () => {
    const res = await worker.fetch(new Request(WORKER, { method: "OPTIONS", headers: { Origin: ORIGIN } }), env(), ctx());
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(ORIGIN);
    expect(res.headers.get("Access-Control-Allow-Methods")).toContain("POST");
  });

  test("preflight from anywhere else gets none", async () => {
    const res = await worker.fetch(new Request(WORKER, { method: "OPTIONS", headers: { Origin: "https://evil.example" } }), env(), ctx());
    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  test("only POST is accepted", async () => {
    const { res, body } = await send(new Request(WORKER, { method: "GET", headers: { Origin: ORIGIN } }));
    expect(res.status).toBe(405);
    expect(body.error).toBe("method_not_allowed");
  });

  test("a foreign origin is refused before anything is called", async () => {
    const { res, body } = await send(post(good, { origin: "https://evil.example" }));
    expect(res.status).toBe(403);
    expect(body.error).toBe("forbidden_origin");
    expect(calls).toHaveLength(0);
  });
});

describe("abuse checks", () => {
  test("the rate limiter keys on the client ip and can refuse", async () => {
    const keys: string[] = [];
    const limiter = { limit: async ({ key }: { key: string }) => (keys.push(key), { success: false }) };
    const { res, body } = await send(post(good), env({ RATE_LIMITER: limiter }));
    expect(res.status).toBe(429);
    expect(body.error).toBe("rate_limited");
    expect(keys).toEqual(["203.0.113.9"]);
    expect(calls).toHaveLength(0);
  });

  test("a passing rate limiter lets the request through", async () => {
    const limiter = { limit: async () => ({ success: true }) };
    const { res } = await send(post(good), env({ RATE_LIMITER: limiter }));
    expect(res.status).toBe(200);
  });

  test("broken json is a bad request", async () => {
    const { res, body } = await send(post("{nope", { raw: true }));
    expect(res.status).toBe(400);
    expect(body.error).toBe("bad_request");
  });

  test("the honeypot pretends success and does nothing", async () => {
    const { res, body } = await send(post({ ...good, website: "http://spam.example" }));
    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(calls).toHaveLength(0);
  });
});

describe("field validation", () => {
  const cases: [string, Record<string, unknown>, string][] = [
    ["path-like slug", { slug: "../etc/passwd" }, "invalid_slug"],
    ["uppercase slug", { slug: "Hello" }, "invalid_slug"],
    ["overlong slug", { slug: "a".repeat(81) }, "invalid_slug"],
    ["missing name", { name: "" }, "invalid_fields"],
    ["punctuation name", { name: "!!! 🙂" }, "invalid_fields"],
    ["one letter message", { message: "a" }, "invalid_fields"],
    ["emoji message", { message: "🔥🔥🔥" }, "invalid_fields"],
    ["non string message", { message: 12345 }, "invalid_fields"],
    ["three links", { message: "see https://a.io http://b.io www.c.io" }, "too_many_links"],
    ["link in name", { name: "visit www.spam.io" }, "too_many_links"],
    ["no token", { turnstileToken: "" }, "missing_token"],
  ];
  for (const [label, patch, error] of cases) {
    test(label, async () => {
      const { res, body } = await send(post({ ...good, ...patch }));
      expect(res.status).toBe(400);
      expect(body).toEqual({ success: false, error });
      expect(ghCalls()).toHaveLength(0);
    });
  }

  test("two links are fine", async () => {
    const { res } = await send(post({ ...good, message: "see https://a.io and www.b.io" }));
    expect(res.status).toBe(200);
  });
});

describe("turnstile and posts", () => {
  test("turnstile gets the secret, token and ip", async () => {
    await send(post(good));
    const verify = calls.find((c) => c.url.includes("siteverify"))!;
    const form = new URLSearchParams(verify.body);
    expect(verify.method).toBe("POST");
    expect(form.get("secret")).toBe("ts-secret");
    expect(form.get("response")).toBe("tok");
    expect(form.get("remoteip")).toBe("203.0.113.9");
  });

  test("a failed challenge is refused before github", async () => {
    overrides["POST siteverify"] = () => json({ success: false });
    const { res, body } = await send(post(good));
    expect(res.status).toBe(403);
    expect(body.error).toBe("failed_verification");
    expect(ghCalls()).toHaveLength(0);
  });

  test("unknown posts and drafts are 404", async () => {
    for (const slug of ["nope", "secret-draft"]) {
      const { res, body } = await send(post({ ...good, slug }));
      expect(res.status).toBe(404);
      expect(body.error).toBe("unknown_post");
    }
  });

  test("a post without an id is refused", async () => {
    const { res, body } = await send(post({ ...good, slug: "no-id" }));
    expect(res.status).toBe(500);
    expect(body.error).toBe("post_missing_id");
  });

  test("the post list is cached between requests", async () => {
    await send(post(good));
    await send(post(good));
    expect(calls.filter((c) => c.url.includes("/contents/content/blog.json"))).toHaveLength(1);
  });

  test("github errors come back generic", async () => {
    overrides["GET /git/ref/heads/main"] = () => new Response("internal detail gh-secret-token", { status: 500 });
    const { res, body } = await send(post(good));
    expect(res.status).toBe(502);
    expect(body).toEqual({ success: false, error: "server_error" });
  });

  test("a blog.json fetch error is generic too", async () => {
    overrides["GET /contents/content/blog.json"] = () => new Response("boom", { status: 403 });
    const { res, body } = await send(post(good));
    expect(res.status).toBe(502);
    expect(body).toEqual({ success: false, error: "server_error" });
  });
});

describe("happy path", () => {
  test("opens a branch, a file and a labelled pr", async () => {
    const message = "Great read @octocat\n\n\n\nsee ```` fence​";
    const { res, body } = await send(post({ ...good, name: "  @ana‮  ", message }));
    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true, url: "https://github.com/dudustri/blog/pull/42" });
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(ORIGIN);

    for (const c of ghCalls()) {
      expect(c.headers.get("Authorization")).toBe("Bearer gh-secret-token");
      expect(c.headers.get("User-Agent")).toBeTruthy();
    }

    const ref = ghCalls().find((c) => c.method === "POST" && c.url.endsWith("/git/refs"))!;
    const refBody = JSON.parse(ref.body);
    expect(refBody.sha).toBe("base-sha");
    expect(refBody.ref).toMatch(/^refs\/heads\/comment\/hello-\d{8}-\d{6}-[0-9a-f]{8}$/);
    const branch = refBody.ref.replace("refs/heads/", "");

    const put = ghCalls().find((c) => c.method === "PUT")!;
    expect(put.url).toMatch(/\/contents\/content\/comments\/2026-03-15-aaaa\/\d{8}-\d{6}-[0-9a-f]{8}\.json$/);
    const putBody = JSON.parse(put.body);
    expect(putBody.branch).toBe(branch);
    const file = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(putBody.content), (c) => c.charCodeAt(0))));
    expect(file).toMatchObject({ postId: "2026-03-15-aaaa", slug: "hello", name: "@ana" });
    expect(file.message).toBe("Great read @octocat\n\nsee ```` fence");
    expect(file.date).toMatch(/^\d{2}-\d{2}-\d{4}$/);

    const pr = JSON.parse(ghCalls().find((c) => c.url.endsWith("/pulls"))!.body);
    expect(pr.head).toBe(branch);
    expect(pr.base).toBe("main");
    expect(pr.body).toContain("**@​ana** left a comment on [hello](https://eduardo.dk/blog/hello).");
    expect(pr.body).not.toMatch(/\*\*@ana/);
    // the message is fenced and cannot close the fence early
    expect(pr.body).toContain("````\nGreat read @octocat\n\nsee ``` fence\n````");
    expect(pr.body).toContain("· DK ·");

    const labels = ghCalls().find((c) => c.url.includes("/issues/42/labels"))!;
    expect(JSON.parse(labels.body)).toEqual({ labels: ["comment"] });
  });

  test("a failing label call does not lose the comment", async () => {
    overrides["POST /labels"] = () => new Response("no such label", { status: 422 });
    const { res, body } = await send(post(good));
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  test("long fields are capped", async () => {
    await send(post({ ...good, name: "N".repeat(100), message: "m".repeat(3000) }));
    const putBody = JSON.parse(ghCalls().find((c) => c.method === "PUT")!.body);
    const file = JSON.parse(atob(putBody.content));
    expect(file.name).toHaveLength(60);
    expect(file.message).toHaveLength(2000);
  });
});
