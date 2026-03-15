import data from "@/content/blog.json";

export type Post = (typeof data)[0];

export const posts = [...data].sort((a, b) => {
  const parse = (d: string) => { const [day, month, year] = d.split("-"); return new Date(+year, +month - 1, +day).getTime(); };
  return parse(b.date) - parse(a.date);
});
