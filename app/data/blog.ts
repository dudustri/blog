import data from "@/content/blog.json";

export type Post = (typeof data)[0];

export const posts = [...data].sort((a, b) => {
  const parse = (d: string) => { const [day, month, year] = d.split("-"); return new Date(+year, +month - 1, +day).getTime(); };
  return parse(b.date) - parse(a.date);
});

// "19-09-2026" → "19 September 2026"
export function formatDate(date: string) {
  const [day, month, year] = date.split("-");
  return new Date(+year, +month - 1, +day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
