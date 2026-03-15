import Link from "next/link";
import { notFound } from "next/navigation";
import { posts } from "@/app/data/blog";

// Renders a block of content.
// Supported block types (each separated by \n\n in the JSON):
//   # Heading       → <h2>
//   ## Subheading   → <h3>
//   ![alt](src)     → inline image
//   anything else   → paragraph
function renderContent(content: string) {
  return content.split("\n\n").map((block, i) => {
    const trimmed = block.trim();

    if (trimmed.startsWith("# ")) {
      return (
        <h2 key={i} className="text-2xl font-bold mt-8 mb-3">
          {trimmed.slice(2)}
        </h2>
      );
    }

    if (trimmed.startsWith("## ")) {
      return (
        <h3 key={i} className="text-xl font-semibold mt-6 mb-2">
          {trimmed.slice(3)}
        </h3>
      );
    }

    // Inline image: ![alt text](src)
    const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={imgMatch[2]}
          alt={imgMatch[1]}
          className="w-full rounded-xl object-cover my-2"
          style={{ maxHeight: 600 }}
        />
      );
    }

    return (
      <p key={i} className="text-gray-700 leading-relaxed">
        {trimmed}
      </p>
    );
  });
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const idx = posts.findIndex((p) => p.slug === slug);
  if (idx === -1) notFound();

  const post = posts[idx];
  const prevPost = idx > 0 ? posts[idx - 1] : null;
  const nextPost = idx < posts.length - 1 ? posts[idx + 1] : null;

  const headImage = "headImage" in post ? (post.headImage as string) : null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <style>{`
        @keyframes fadeDecay {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
      {/* Navigation — always at the very top */}
      <div className="flex items-center justify-between mb-8">
        <Link href="/blog" className="text-sm text-gray-500 hover:text-black transition-colors">
          ← Back
        </Link>
        <div className="flex items-center gap-6 text-sm text-gray-400">
          {prevPost && (
            <Link
              href={`/blog/${prevPost.slug}`}
              className="hover:text-black transition-colors"
              title={prevPost.title}
            >
              ← Prev
            </Link>
          )}
          {nextPost && (
            <Link
              href={`/blog/${nextPost.slug}`}
              className="hover:text-black transition-colors"
              title={nextPost.title}
            >
              Next →
            </Link>
          )}
        </div>
      </div>

      {/* Head image — full image if provided, blue banner strip otherwise */}
      {headImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={headImage}
          alt=""
          className="w-full rounded-2xl object-cover mb-8"
          style={{ maxHeight: 480 }}
        />
      ) : (
        <div
          className="w-full rounded-2xl mb-8"
          style={{ height: 80, background: "#3e6b89" }}
        />
      )}

      <h1 className="text-3xl font-bold tracking-tight mb-1">{post.title}</h1>
      <p className="text-gray-400 text-sm mb-8">{post.date}</p>

      <div className="space-y-4">{renderContent(post.content)}</div>

      {/* Bottom images — fade away once */}
      {post.images && post.images.length > 0 && (
        <div className="mt-10 space-y-6">
          {post.images.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt=""
              className="w-full rounded-xl object-cover"
              style={{
                maxHeight: 600,
                animation: "fadeDecay 4s ease-in forwards",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export async function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}
