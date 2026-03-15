import Link from "next/link";
import { posts } from "@/app/data/blog";

export default function BlogPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold tracking-tight mb-10">Blog</h1>
      <div className="divide-y divide-gray-100">
        {posts.map((post) => (
          <article key={post.slug} className="py-6 first:pt-0">
            <Link href={`/blog/${post.slug}`} className="group block">
              <div className="flex items-baseline justify-between gap-4 mb-1">
                <h2 className="font-semibold group-hover:underline">{post.title}</h2>
                <span className="text-gray-400 text-sm whitespace-nowrap">{post.date}</span>
              </div>
              <p className="text-gray-600 text-sm">{post.excerpt}</p>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
