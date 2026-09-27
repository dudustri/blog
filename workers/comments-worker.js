/**
 * opens a PR adding content/comments/<post id>/<file>.json, merge to publish
 *
 * vars:    GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH, ALLOWED_ORIGINS, SITE_URL
 * secrets: GITHUB_TOKEN, TURNSTILE_SECRET
 * binding: RATE_LIMITER (optional)
 */

const MAX_NAME = 60;
const MAX_MESSAGE = 2000;
const MIN_MESSAGE = 2;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_LINKS = 2;
// zero-width and bidi marks can hide or visually reorder text
const INVISIBLE = /[\u00ad\u200b-\u200f\u202a-\u202e\u2060-\u2064\u2066-\u2069\ufeff]/g;
const COMMENTS_DIR = "content/comments";
const GITHUB_API = "https://api.github.com";
const GITHUB_API_VERSION = "2026-03-10";
const USER_AGENT = "blog-comments-worker";

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin") ?? "";
    const allowed = env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean);
    const cors = allowed.includes(origin)
      ? {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
          Vary: "Origin",
        }
      : {};

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== "POST") {
      return json({ success: false, error: "method_not_allowed" }, 405, cors);
    }
    if (!allowed.includes(origin)) {
      return json({ success: false, error: "forbidden_origin" }, 403, cors);
    }

    const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
    if (env.RATE_LIMITER) {
      const { success } = await env.RATE_LIMITER.limit({ key: ip });
      if (!success) return json({ success: false, error: "rate_limited" }, 429, cors);
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return json({ success: false, error: "bad_request" }, 400, cors);
    }

    // honeypot: hidden field, anything in it is a bot. 200 so it learns nothing
    if (typeof payload.website === "string" && payload.website.trim() !== "") {
      return json({ success: true }, 200, cors);
    }

    const slug = typeof payload.slug === "string" ? payload.slug.trim() : "";
    const name = clean(payload.name, MAX_NAME);
    const message = clean(payload.message, MAX_MESSAGE, true);
    const token = typeof payload.turnstileToken === "string" ? payload.turnstileToken : "";

    if (!SLUG_RE.test(slug) || slug.length > 80) {
      return json({ success: false, error: "invalid_slug" }, 400, cors);
    }
    if (!hasWords(name, 1) || !hasWords(message, MIN_MESSAGE)) {
      return json({ success: false, error: "invalid_fields" }, 400, cors);
    }
    if (countLinks(message) > MAX_LINKS || countLinks(name) > 0) {
      return json({ success: false, error: "too_many_links" }, 400, cors);
    }
    if (!token) {
      return json({ success: false, error: "missing_token" }, 400, cors);
    }
    if (!(await verifyTurnstile(env, token, ip))) {
      return json({ success: false, error: "failed_verification" }, 403, cors);
    }

    try {
      const post = (await publishedPosts(env, ctx)).get(slug);
      if (!post) {
        return json({ success: false, error: "unknown_post" }, 404, cors);
      }
      if (!post.id) {
        return json({ success: false, error: "post_missing_id" }, 500, cors);
      }
      const country = request.headers.get("CF-IPCountry") ?? "??";
      const url = await openCommentPr(env, { post, slug, name, message, country });
      return json({ success: true, url }, 200, cors);
    } catch (err) {
      console.error("comment failed", err instanceof Error ? err.message : err);
      return json({ success: false, error: "server_error" }, 502, cors);
    }
  },
};

async function openCommentPr(env, { post, slug, name, message, country }) {
  const repo = `/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}`;
  const now = new Date();
  const id = crypto.randomUUID().slice(0, 8);
  const stamp = compactStamp(now);

  // postId is the real link, slug only so a stray file stays traceable
  const body = {
    id,
    postId: post.id,
    slug,
    name,
    message,
    date: displayDate(now),
    submitted: now.toISOString(),
  };

  const base = await ghJson(env, `${repo}/git/ref/heads/${env.GITHUB_BRANCH}`);
  const branch = `comment/${slug}-${stamp}-${id}`;
  await ghJson(env, `${repo}/git/refs`, {
    method: "POST",
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: base.object.sha }),
  });

  await ghJson(env, `${repo}/contents/${COMMENTS_DIR}/${post.id}/${stamp}-${id}.json`, {
    method: "PUT",
    body: JSON.stringify({
      message: `comment: ${name} on ${slug}`,
      content: toBase64(JSON.stringify(body, null, 2) + "\n"),
      branch,
    }),
  });

  // fenced, not quoted: a comment must not render as markdown in the PR body
  const fenced = "````\n" + message.replace(/`{4,}/g, "```") + "\n````";
  const postUrl = `${env.SITE_URL.replace(/\/$/, "")}/blog/${slug}`;
  const pr = await ghJson(env, `${repo}/pulls`, {
    method: "POST",
    body: JSON.stringify({
      title: `comment: ${name} on ${slug}`,
      head: branch,
      base: env.GITHUB_BRANCH,
      body: [
        `**${name}** left a comment on [${slug}](${postUrl}).`,
        "",
        fenced,
        "",
        "---",
        "Merge to publish it, close to reject it.",
        "",
        `\`${id}\` · ${country} · ${displayDate(now)}`,
      ].join("\n"),
    }),
  });

  // missing label must not lose comment
  try {
    await ghJson(env, `${repo}/issues/${pr.number}/labels`, {
      method: "POST",
      body: JSON.stringify({ labels: ["comment"] }),
    });
  } catch {
    /* ignore */
  }

  return pr.html_url;
}

async function verifyTurnstile(env, token, ip) {
  const form = new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token });
  if (ip !== "unknown") form.set("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form,
  });
  const data = await res.json();
  return data.success === true;
}

// published posts from blog.json by slug, cached 5 min. drafts excluded
async function publishedPosts(env, ctx) {
  const key = new Request(
    `https://slugs.internal/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/${env.GITHUB_BRANCH}`
  );
  let hit = await caches.default.match(key);

  if (!hit) {
    const res = await gh(
      env,
      `/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/content/blog.json?ref=${env.GITHUB_BRANCH}`,
      { headers: { Accept: "application/vnd.github.raw+json" } }
    );
    if (!res.ok) throw new Error(`blog.json: ${res.status}`);
    hit = new Response(await res.text(), {
      headers: { "Content-Type": "application/json", "Cache-Control": "max-age=300" },
    });
    ctx.waitUntil(caches.default.put(key, hit.clone()));
  }

  const posts = JSON.parse(await hit.text());
  return new Map(posts.filter((p) => !p.draft).map((p) => [p.slug, p]));
}

function gh(env, path, init = {}) {
  return fetch(`${GITHUB_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": GITHUB_API_VERSION,
      "User-Agent": USER_AGENT,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
  });
}

async function ghJson(env, path, init = {}) {
  const res = await gh(env, path, init);
  if (!res.ok) {
    throw new Error(`github ${init.method ?? "GET"} ${path}: ${res.status} ${await res.text()}`);
  }
  return await res.json();
}

// cap length, strip control and invisible chars, collapse whitespace
function clean(input, max, allowNewlines = false) {
  if (typeof input !== "string") return "";
  let out = input.normalize("NFC").replace(/\r\n?/g, "\n").replace(INVISIBLE, "");
  out = [...out]
    .map((ch) => {
      // a newline in a single-line field becomes a space, not nothing
      if (ch === "\n") return allowNewlines ? ch : " ";
      return ch.codePointAt(0) >= 32 && ch !== "\x7f" ? ch : "";
    })
    .join("");
  out = allowNewlines
    ? out.replace(/[^\S\n]+/g, " ").replace(/\n{3,}/g, "\n\n")
    : out.replace(/\s+/g, " ");
  return out.trim().slice(0, max);
}

// real characters, not just punctuation or emoji
function hasWords(text, min) {
  return (text.match(/[\p{L}\p{N}]/gu) ?? []).length >= min;
}

function countLinks(text) {
  return (text.match(/https?:\/\/|www\./gi) ?? []).length;
}

function toBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

const pad = (n) => String(n).padStart(2, "0");

// 20260920-134501, sorts chronologically
function compactStamp(d) {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `-${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`
  );
}

function displayDate(d) {
  return `${pad(d.getUTCDate())}-${pad(d.getUTCMonth() + 1)}-${d.getUTCFullYear()}`;
}

function json(body, status, cors) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}
