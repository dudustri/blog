import TrailBackground from "@/app/components/TrailBackground";
import { companyLogos } from "@/app/data/resume";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// logo strip for every company in resume, over a cursor-trail background
// (TrailBackground). grayscale, lift to full color on hover
// the ring says which logo the pointer is on, the strip is dense and the
// colour lift alone is easy to miss on a logo that is already pale. it hugs
// the image box, tones live in globals.css so each theme gets its own
const TILE = "group shrink-0 focus-visible:outline-none";
const LOGO =
  "logo-mark h-9 md:h-11 w-auto object-contain grayscale rounded-md transition-all duration-200 group-hover:grayscale-0 group-focus-visible:grayscale-0";

export default function CompanyLogos() {
  return (
    <section className="mt-16 pt-8 border-t border-gray-200">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 text-center mb-8">
        Where I have worked
      </h2>

      <div className="relative overflow-hidden outline-box rounded-2xl border-gray-200">
        <TrailBackground />

        <div className="relative z-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-8 px-6 py-12">
          {companyLogos.map((c) => {
            const img = (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`${BASE}${c.logo}`}
                alt={c.company}
                className={LOGO}
              />
            );
            return c.website ? (
              <a
                key={c.company}
                href={c.website}
                target="_blank"
                rel="noopener noreferrer"
                title={c.company}
                className={TILE}
              >
                {img}
              </a>
            ) : (
              <span key={c.company} title={c.company} className={TILE}>
                {img}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
