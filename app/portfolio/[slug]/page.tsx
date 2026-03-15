import Link from "next/link";
import { notFound } from "next/navigation";
import { projects } from "@/app/data/portfolio";

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
      <h1 className="text-3xl font-bold tracking-tight mb-1">{project.title}</h1>
      <p className="text-gray-600 mb-3">{project.description}</p>
      <div className="flex flex-wrap gap-2 mb-8">
        {project.tech.map((t) => (
          <span key={t} className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
            {t}
          </span>
        ))}
      </div>
      <div className="space-y-4">{renderContent(project.content)}</div>
    </div>
  );
}

export async function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}
