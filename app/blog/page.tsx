import type { Metadata } from "next";
import Link from "next/link";
import { posts, formatDmyDate } from "@/app/data/blog";

export const metadata: Metadata = {
  title: "Blog",
  description: "Notes on engineering, travel, and whatever else is worth writing down.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog",
    description: "Notes on engineering, travel, and whatever else is worth writing down.",
    url: "/blog",
  },
};


const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// same treatment the portfolio tiles use, so posts without a head image still
// get a stable block instead of a ragged gap
const GRADIENTS = [
  "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
  "linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)",
  "linear-gradient(135deg, #f3e7e9 0%, #e3eeff 100%)",
  "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)",
];
function gradientFor(slug: string) {
  let h = 0;
  for (const c of slug) h = (h * 31 + c.charCodeAt(0)) % GRADIENTS.length;
  return GRADIENTS[Math.abs(h) % GRADIENTS.length];
}

const THUMB = "h-16 w-24 sm:h-20 sm:w-32 flex-shrink-0 rounded-lg overflow-hidden";

export default function BlogPage() {
  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-10 select-none">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Blog</h1>
      <p className="text-gray-500 text-[15px] leading-relaxed max-w-xl mb-10">
        Notes on engineering, travel, and whatever else is worth writing down.
      </p>
      <div className="divide-y divide-gray-100">
        {posts.filter((post) => !post.draft).map((post) => {
          // headImage carries an optional #crop hint that is not part of the path
          const raw = "headImage" in post ? (post.headImage as string) : null;
          const [src, pos] = raw ? raw.split("#") : [null, undefined];
          const objectPosition = pos
            ? /%$/.test(pos) ? `center ${pos}` : pos
            : undefined;

          return (
            <article key={post.slug} className="py-6 first:pt-0">
              <Link href={`/blog/${post.slug}`} className="group flex items-start gap-5">
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`${BASE}${src}`}
                    alt=""
                    className={`${THUMB} object-cover`}
                    style={{ objectPosition }}
                  />
                ) : (
                  <div
                    className={`${THUMB} flex items-center justify-center`}
                    style={{ background: gradientFor(post.slug) }}
                  >
                    <span className="text-2xl font-bold text-white/50">{post.title[0]}</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-4 mb-1">
                    <h2 className="card-hint font-semibold transition-colors duration-200">
                      {post.title}
                    </h2>
                    <time className="text-gray-400 text-sm whitespace-nowrap">
                      {formatDmyDate(post.date)}
                    </time>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{post.excerpt}</p>
                </div>
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
