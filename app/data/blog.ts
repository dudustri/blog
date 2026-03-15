import data from "@/content/blog.json";

export type Post = (typeof data)[0];
export const posts = data;
