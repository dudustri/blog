import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { posts } from "@/app/data/blog";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// Named visual effects usable as a content block (see renderContent).
//   fade → image that fades away once on load (the original "suspdog" decay)
const EFFECTS: Record<string, CSSProperties> = {
  fade: { animation: "fadeDecay 4s ease-in forwards" },
};

// Renders inline markup within a paragraph.
// Supported: **bold** → <strong>
function renderInline(text: string) {
  return text.split(/(\*\*.*?\*\*)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

// Renders a block of content.
// Supported block types (each separated by \n\n in the JSON):
//   # Heading        → <h2>
//   ## Subheading    → <h3>
//   ##effect src     → image with a named effect, e.g. "##fade /images/suspdog2.jpg"
//   ![alt](src)      → inline image
//   anything else    → paragraph (supports inline **bold**)
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

    // Effect image: ##<effect> <src>   e.g. "##fade /images/suspdog2.jpg"
    // Two sequential # immediately followed by the effect name (no space, so it
    // doesn't collide with "## Subheading"). The src supports the same optional
    // #position hash as inline images.
    const effectMatch = trimmed.match(/^##(\w+)\s+(\S+)$/);
    if (effectMatch && EFFECTS[effectMatch[1]]) {
      const [, effect, raw] = effectMatch;
      const [src, pos] = raw.split("#");
      const objectPosition = pos
        ? /%$/.test(pos)
          ? `center ${pos}`
          : pos
        : undefined;
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={`${BASE}${src}`}
          alt=""
          className="w-full rounded-xl object-cover my-8"
          style={{ maxHeight: 600, objectPosition, ...EFFECTS[effect] }}
        />
      );
    }

    // Inline image: ![alt text](src)
    // Optional crop position via a #hash on the src, e.g. ![alt](/img.jpg#top)
    //   #top | #bottom | #center  → object-position keyword
    //   #30% (or #50%)            → vertical object-position (top..bottom)
    const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      const [src, pos] = imgMatch[2].split("#");
      const objectPosition = pos
        ? /%$/.test(pos)
          ? `center ${pos}`
          : pos
        : undefined;
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={`${BASE}${src}`}
          alt={imgMatch[1]}
          className="w-full rounded-xl object-cover my-8"
          style={{ maxHeight: 600, objectPosition }}
        />
      );
    }

    return (
      <p key={i} className="text-gray-700 leading-relaxed text-justify indent-8">
        {renderInline(trimmed)}
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

  // Skip over draft posts when finding prev/next neighbours.
  const isPublished = (p: (typeof posts)[number]) =>
    !("draft" in p && p.draft);
  let prevPost: (typeof posts)[number] | null = null;
  for (let i = idx - 1; i >= 0; i--) {
    if (isPublished(posts[i])) { prevPost = posts[i]; break; }
  }
  let nextPost: (typeof posts)[number] | null = null;
  for (let i = idx + 1; i < posts.length; i++) {
    if (isPublished(posts[i])) { nextPost = posts[i]; break; }
  }

  const headImageRaw =
    "headImage" in post ? (post.headImage as string) : null;
  // Optional crop position via a #hash on the src, e.g. "/img.jpg#15%"
  //   #top | #bottom | #center → keyword; #15% → vertical position (top..bottom)
  const [headImage, headPos] = headImageRaw
    ? headImageRaw.split("#")
    : [null, undefined];
  const headObjectPosition = headPos
    ? /%$/.test(headPos)
      ? `center ${headPos}`
      : headPos
    : undefined;

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-10">
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
          src={`${BASE}${headImage}`}
          alt=""
          className="w-full rounded-2xl object-cover mb-8"
          style={{ maxHeight: 480, objectPosition: headObjectPosition }}
        />
      ) : (
        <div
          className="w-full mb-8"
          style={{ height: 80, background: "#3e6b89" }}
        />
      )}

      <h1 className="text-3xl font-bold tracking-tight mb-1">{post.title}</h1>
      <p className="text-gray-400 text-sm mb-8">{post.date}</p>

      <div className="space-y-4">{renderContent(post.content)}</div>
    </div>
  );
}

export async function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}
