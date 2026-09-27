/**
 * give every post in content/blog.json a permanent id
 *
 * run:
 *   bun run ids           # fill in missing ids, write the file
 *   bun run ids --check   # fail if any id is missing or duplicated, write nothing
 *
 * comments hang off these ids (content/comments/<id>/), so an id must never
 * change once a post has one. this only ever fills a gap, it never rewrites an
 * existing id. build runs --check so a post added without an id fails loudly
 * instead of quietly getting a fresh id on every build.
 *
 * shape: <post date, YYYY-MM-DD>-<4 hex>, e.g. 2026-03-15-a1b2
 */

import { readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BLOG = join(__dirname, "..", "content", "blog.json");

type Post = { id?: string; slug: string; date: string; [k: string]: unknown };

const check = process.argv.includes("--check");

// "15-03-2026" → "2026-03-15"
function isoDate(date: string, slug: string): string {
  const [day, month, year] = date.split("-");
  if (!day || !month || !year || year.length !== 4) {
    console.error(`✗ ${slug}: date "${date}" is not DD-MM-YYYY`);
    process.exit(1);
  }
  return `${year}-${month}-${day}`;
}

const posts: Post[] = JSON.parse(await readFile(BLOG, "utf8"));

const seen = new Map<string, string>();
const missing: Post[] = [];

for (const post of posts) {
  if (!post.id) {
    missing.push(post);
    continue;
  }
  const clash = seen.get(post.id);
  if (clash) {
    console.error(`✗ duplicate id ${post.id}: "${clash}" and "${post.slug}"`);
    process.exit(1);
  }
  seen.set(post.id, post.slug);
}

if (check) {
  if (missing.length) {
    for (const post of missing) console.error(`✗ no id: ${post.slug}`);
    console.error(`\n${missing.length} post(s) without an id. run: bun run ids`);
    process.exit(1);
  }
  console.log(`✓ ${posts.length} posts, every id present and unique`);
  process.exit(0);
}

if (!missing.length) {
  console.log(`✓ ${posts.length} posts, nothing to assign`);
  process.exit(0);
}

for (const post of missing) {
  let id: string;
  do {
    id = `${isoDate(post.date, post.slug)}-${randomBytes(2).toString("hex")}`;
  } while (seen.has(id));
  seen.set(id, post.slug);

  // id first, so it reads as the post's identity rather than another field
  const { ...rest } = post;
  delete rest.id;
  for (const key of Object.keys(post)) delete post[key];
  Object.assign(post, { id, ...rest });
  console.log(`+ ${id}  ${post.slug}`);
}

await writeFile(BLOG, JSON.stringify(posts, null, 2) + "\n");
console.log(`\nwrote ${missing.length} id(s) to content/blog.json`);
