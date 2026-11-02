import { afterEach, expect, test } from "bun:test";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SCRIPT = join(import.meta.dir, "..", "scripts", "ensure-post-ids.ts");
let dir = "";

// the script resolves content/blog.json next to itself, so it runs on a copied tree
function setup(posts: unknown[]) {
  dir = mkdtempSync(join(tmpdir(), "post-ids-"));
  mkdirSync(join(dir, "scripts"));
  mkdirSync(join(dir, "content"));
  copyFileSync(SCRIPT, join(dir, "scripts", "ensure-post-ids.ts"));
  writeFileSync(join(dir, "content", "blog.json"), JSON.stringify(posts, null, 2) + "\n");
}
const run = (...args: string[]) => Bun.spawnSync(["bun", join(dir, "scripts", "ensure-post-ids.ts"), ...args], { stderr: "pipe", stdout: "pipe" });
const read = () => JSON.parse(readFileSync(join(dir, "content", "blog.json"), "utf8"));

afterEach(() => rmSync(dir, { recursive: true, force: true }));

test("check passes when every id is present", () => {
  setup([{ id: "2026-03-15-aaaa", slug: "a", date: "15-03-2026" }]);
  const r = run("--check");
  expect(r.exitCode).toBe(0);
});

test("check fails on a missing id and writes nothing", () => {
  setup([{ slug: "a", date: "15-03-2026" }]);
  const before = readFileSync(join(dir, "content", "blog.json"), "utf8");
  const r = run("--check");
  expect(r.exitCode).toBe(1);
  expect(r.stderr.toString()).toContain("no id: a");
  expect(readFileSync(join(dir, "content", "blog.json"), "utf8")).toBe(before);
});

test("duplicate ids fail", () => {
  setup([
    { id: "2026-03-15-aaaa", slug: "a", date: "15-03-2026" },
    { id: "2026-03-15-aaaa", slug: "b", date: "15-03-2026" },
  ]);
  expect(run("--check").exitCode).toBe(1);
  expect(run().exitCode).toBe(1);
});

test("fills missing ids first in the object and keeps existing ones", () => {
  setup([
    { slug: "new", date: "16-03-2026", title: "t" },
    { id: "2026-03-15-aaaa", slug: "old", date: "15-03-2026" },
  ]);
  expect(run().exitCode).toBe(0);
  const [fresh, old] = read();
  expect(Object.keys(fresh)[0]).toBe("id");
  expect(fresh.id).toMatch(/^2026-03-16-[0-9a-f]{4}$/);
  expect(fresh).toMatchObject({ slug: "new", title: "t" });
  expect(old.id).toBe("2026-03-15-aaaa");
  expect(run("--check").exitCode).toBe(0);
});

test("a malformed date is refused", () => {
  setup([{ slug: "bad", date: "2026-03-15" }]);
  const r = run();
  expect(r.exitCode).toBe(1);
  expect(r.stderr.toString()).toContain("not DD-MM-YYYY");
});
