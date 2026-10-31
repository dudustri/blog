import data from "@/content/blog.json";

export type Post = (typeof data)[0];

// "19-09-2026" → its local midnight in ms, the one parser for posts and About snapshots
export function dmyTime(date: string) {
  const [day, month, year] = date.split("-");
  return new Date(+year, +month - 1, +day).getTime();
}

export const posts = [...data].sort((a, b) => dmyTime(b.date) - dmyTime(a.date));

// "19-09-2026" → "2026-09-19", for machine readable dates in metadata
export function isoDate(date: string) {
  const [day, month, year] = date.split("-");
  return `${year}-${month}-${day}`;
}

// "19-09-2026" → "19 September 2026"
export function formatDmyDate(date: string) {
  return new Date(dmyTime(date)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
