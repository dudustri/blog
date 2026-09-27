import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type Comment = {
  id: string;
  name: string;
  message: string;
  date: string;
};

const DIR = join(process.cwd(), "content", "comments");

// zero-width and bidi marks can hide or visually reorder text, so they go
const INVISIBLE = /[\u00ad\u200b-\u200f\u202a-\u202e\u2060-\u2064\u2066-\u2069\ufeff]/g;

// defence in depth: the worker validates on the way in, this catches a tampered file
function clean(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  const kept = [...value.normalize("NFC").replace(INVISIBLE, "")].filter((ch) => {
    if (ch === "\n") return true;
    const code = ch.codePointAt(0) ?? 0;
    return code >= 32 && code !== 127;
  });
  return kept.join("").replace(/\n{3,}/g, "\n\n").trim().slice(0, max);
}

// read at build time from content/comments/<post id>/, a bad file is skipped
export function commentsFor(postId: string): Comment[] {
  let files: string[];
  try {
    files = readdirSync(join(DIR, postId)).filter((f) => f.endsWith(".json")).sort();
  } catch {
    return [];
  }

  const out: Comment[] = [];
  for (const file of files) {
    try {
      const raw = JSON.parse(readFileSync(join(DIR, postId, file), "utf8"));
      const name = clean(raw.name, 60);
      const message = clean(raw.message, 2000);
      if (!name || !message) continue;
      out.push({ id: clean(raw.id, 32) || file, name, message, date: clean(raw.date, 10) });
    } catch {
      continue;
    }
  }
  return out;
}
