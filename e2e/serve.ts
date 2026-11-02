// serves out/ the way github pages does: /about → about.html, unknown → 404.html
import { join, normalize } from "node:path";

const ROOT = join(import.meta.dir, "..", "out");
const PORT = Number(process.env.PORT ?? 3103);

async function file(path: string) {
  const f = Bun.file(join(ROOT, path));
  return (await f.exists()) ? f : null;
}

Bun.serve({
  port: PORT,
  async fetch(req) {
    const path = normalize(decodeURIComponent(new URL(req.url).pathname));
    const hit = (await file(path)) ?? (await file(`${path}.html`)) ?? (await file(join(path, "index.html")));
    if (hit) return new Response(hit);
    return new Response(Bun.file(join(ROOT, "404.html")), { status: 404, headers: { "Content-Type": "text/html" } });
  },
});
console.log(`serving out/ on http://localhost:${PORT}`);
