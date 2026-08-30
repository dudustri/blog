import Link from "next/link";
import { notFound } from "next/navigation";
import { projects } from "@/app/data/portfolio";
import MatterBackground from "@/app/components/MatterBackground";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function renderContent(content: string) {
  return content.split("\n\n").map((block, i) => {
    if (block.startsWith("# ")) {
      return (
        <h1 key={i} className="text-2xl font-bold mt-8 mb-3">
          {block.slice(2)}
        </h1>
      );
    }
    if (block.startsWith("## ")) {
      return (
        <h2 key={i} className="text-xl font-semibold mt-6 mb-2">
          {block.slice(3)}
        </h2>
      );
    }
    // Bullet list: every line starts with "- ".
    if (block.split("\n").every((l) => l.startsWith("- "))) {
      return (
        <ul key={i} className="list-disc pl-5 space-y-1 text-gray-700 leading-relaxed">
          {block.split("\n").map((l, j) => (
            <li key={j}>{l.slice(2)}</li>
          ))}
        </ul>
      );
    }
    // Markdown image block: ![alt](/path). Alt becomes the caption.
    const img = block.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (img) {
      const [, alt, src] = img;
      return (
        <figure key={i} className="my-6">
          <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${BASE}${src}`}
              alt={alt}
              className="w-full min-w-[640px] h-auto"
            />
          </div>
          {alt ? (
            <figcaption className="text-xs text-gray-400 mt-2 text-center">{alt}</figcaption>
          ) : null}
        </figure>
      );
    }
    return (
      <p key={i} className="text-gray-700 leading-relaxed">
        {block}
      </p>
    );
  });
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) notFound();

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <Link
        href="/portfolio"
        className="text-sm text-gray-500 hover:text-black mb-8 inline-block"
      >
        ← Back
      </Link>
      {/* Matter hero: cursor-repelling squares behind the project title. */}
      <div className="relative h-40 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden mb-5 select-none">
        <MatterBackground count={16} />
        <div className="relative z-10 p-5 pointer-events-none">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{project.title}</h1>
        </div>
      </div>
      <p className="text-gray-600 mb-3">{project.description}</p>
      <div className="flex flex-wrap gap-2 mb-8">
        {project.tech.map((t) => (
          <span key={t} className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
            {t}
          </span>
        ))}
      </div>
      {project.wip ? (
        <div className="rounded-xl border border-dashed border-gray-300 px-6 py-10 text-center">
          <span className="inline-block text-[11px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded bg-amber-100 text-amber-700 mb-3">
            To be done
          </span>
          <p className="text-gray-500 text-sm">
            This project write-up is still to be done. See the Resume page for the full context for now.
          </p>
        </div>
      ) : (
        <div className="space-y-4">{renderContent(project.content)}</div>
      )}
    </div>
  );
}

export async function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}
