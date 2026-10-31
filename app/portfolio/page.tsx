import type { Metadata } from "next";
import Link from "next/link";
import { plainText, projects } from "@/app/data/portfolio";
import MatterBackground from "@/app/components/MatterBackground";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Projects built by Eduardo Sfreddo Trindade, from energy and industrial systems to embedded devices and cloud applications.",
  alternates: { canonical: "/portfolio" },
  openGraph: {
    title: "Portfolio",
    description: "Projects built by Eduardo Sfreddo Trindade, from energy and industrial systems to embedded devices and cloud applications.",
    url: "/portfolio",
  },
};


const gradients = [
  "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
  "linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)",
  "linear-gradient(135deg, #f3e7e9 0%, #e3eeff 100%)",
  "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)",
];

const TECH_SHOWN = 5;

function projectGradient(slug: string) {
  let h = 0;
  for (const c of slug) h = (h * 31 + c.charCodeAt(0)) % gradients.length;
  return gradients[Math.abs(h) % gradients.length];
}

export default function PortfolioPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10 select-none">
      <h1 className="text-3xl font-bold tracking-tight mb-10">Portfolio</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map((project) => (
          <Link
            key={project.slug}
            href={`/portfolio/${project.slug}`}
            className="nav-card group flex h-full flex-col border border-gray-200 rounded-xl overflow-hidden"
          >
            {/* image area */}
            <div className="w-full h-40 overflow-hidden relative bg-gray-50">
              {project.slug === "personal-blog" ? (
                // this very site: show its own gravity-square physics
                <MatterBackground count={12} />
              ) : project.heroCast && project.heroImage ? (
                // same backdrop and physics as the project's own hero, just a
                // handful of porings since the card is a third of the width
                <div
                  className="w-full h-full"
                  style={{
                    backgroundImage: `url(${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${project.heroImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center bottom",
                  }}
                >
                  <MatterBackground
                    cast={project.heroCast
                      .filter((c) => c.name === "poring")
                      .map((c) => ({ ...c, count: 6 }))}
                  />
                </div>
              ) : project.wip ? (
                // still to be written, the badge carries the message
                <div className="w-full h-full bg-black" />
              ) : project.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${project.image}`}
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

            {/* card body */}
            <div className="flex flex-1 flex-col p-5">
              <div className="flex items-start gap-2 mb-1.5">
                <h2 className="card-hint font-semibold transition-colors duration-200">{project.title}</h2>
                {project.wip ? (
                  <span className="flex-shrink-0 mt-0.5 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                    To be done
                  </span>
                ) : null}
              </div>
              <p className="flex-1 text-gray-500 text-sm leading-relaxed mb-4">
                {plainText(project.description)}
              </p>
              {/* capped, an unbounded list wrapped to three rows and made one
                  card much taller than its neighbours */}
              <div className="flex flex-wrap gap-1.5">
                {project.tech.slice(0, TECH_SHOWN).map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600"
                  >
                    {t}
                  </span>
                ))}
                {project.tech.length > TECH_SHOWN && (
                  <span
                    className="text-xs px-2 py-0.5 text-gray-400"
                    title={project.tech.slice(TECH_SHOWN).join(", ")}
                  >
                    +{project.tech.length - TECH_SHOWN}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
