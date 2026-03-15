import Link from "next/link";
import { projects } from "@/app/data/portfolio";

const gradients = [
  "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
  "linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)",
  "linear-gradient(135deg, #f3e7e9 0%, #e3eeff 100%)",
  "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)",
];

function projectGradient(slug: string) {
  let h = 0;
  for (const c of slug) h = (h * 31 + c.charCodeAt(0)) % gradients.length;
  return gradients[Math.abs(h) % gradients.length];
}

export default function PortfolioPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold tracking-tight mb-10">Portfolio</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map((project) => (
          <Link
            key={project.slug}
            href={`/portfolio/${project.slug}`}
            className="group block border border-gray-200 rounded-xl overflow-hidden hover:border-black hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
          >
            {/* Image area */}
            <div className="w-full h-40 overflow-hidden">
              {project.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: projectGradient(project.slug) }}
                >
                  <span className="text-5xl font-bold text-white/40 select-none">
                    {project.title[0]}
                  </span>
                </div>
              )}
            </div>

            {/* Card body */}
            <div className="p-5">
              <h2 className="font-semibold mb-1.5 group-hover:underline">{project.title}</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">{project.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {project.tech.map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
