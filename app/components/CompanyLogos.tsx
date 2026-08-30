import TrailBackground from "@/app/components/TrailBackground";
import { experience } from "@/app/data/resume";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// One entry per company that has a logo, in first-seen (most recent) order.
const companyLogos = Array.from(
  experience
    .filter((e) => e.logo)
    .reduce((map, e) => {
      if (!map.has(e.company)) {
        map.set(e.company, { company: e.company, logo: e.logo!, website: e.website });
      }
      return map;
    }, new Map<string, { company: string; logo: string; website?: string }>())
    .values(),
);

// A logo strip for every company in the resume, over a cursor-trail background
// (TrailBackground). Logos are grayscale and lift to full color on hover.
export default function CompanyLogos() {
  return (
    <section className="mt-16 pt-8 border-t border-gray-200">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 text-center mb-8">
        Where I have worked
      </h2>

      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
        <TrailBackground />

        <div className="relative z-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-8 px-6 py-12">
          {companyLogos.map((c) => {
            const img = (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`${BASE}${c.logo}`}
                alt={c.company}
                className="h-9 md:h-11 w-auto object-contain grayscale opacity-70 transition-all duration-200 hover:grayscale-0 hover:opacity-100"
              />
            );
            return c.website ? (
              <a
                key={c.company}
                href={c.website}
                target="_blank"
                rel="noopener noreferrer"
                title={c.company}
                className="shrink-0"
              >
                {img}
              </a>
            ) : (
              <span key={c.company} title={c.company} className="shrink-0">
                {img}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
