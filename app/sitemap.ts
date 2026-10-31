import type { MetadataRoute } from "next";
import { posts, isoDate } from "@/app/data/blog";
import { projects } from "@/app/data/portfolio";

const SITE = "https://eduardo.dk";

// static export needs this fully resolvable at build time
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/resume", "/portfolio", "/blog", "/mundo", "/sports", "/contact"].map(
    (path) => ({
      url: `${SITE}${path}`,
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : 0.8,
    }),
  );

  const published = posts
    .filter((p) => !p.draft)
    .map((p) => ({
      url: `${SITE}/blog/${p.slug}`,
      lastModified: isoDate(p.date),
      changeFrequency: "yearly" as const,
      priority: 0.6,
    }));

  const projectPages = projects.map((p) => ({
    url: `${SITE}/portfolio/${p.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...pages, ...published, ...projectPages];
}
