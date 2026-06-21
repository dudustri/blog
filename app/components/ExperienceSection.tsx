"use client";

import { useState, useEffect } from "react";
import DetailModal, { type Detail } from "./DetailModal";
import type { Experience } from "@/app/data/resume";

const BLUE = "#3e6b89";
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// Hard match against the job's curated `stack` (hardcoded in content/resume.json),
// instead of grepping the free-text description.
function matchesTech(job: Experience, tech: string): boolean {
  return job.stack?.includes(tech) ?? false;
}

// Maps an Experience record to the generic Detail the shared popup renders.
function jobToDetail(job: Experience, activeTech: string | null): Detail {
  return {
    title: job.company,
    subtitle: job.title,
    meta: job.period,
    logo: job.logo,
    website: job.website,
    description: job.description,
    details: job.details,
    highlights: job.highlights,
    projects: job.projects,
    stack: job.stack,
    activeTech,
  };
}

type Props = {
  experience: Experience[];
  selectedJob: Experience | null;
  activeTech: string | null;
  onJobSelect: (job: Experience) => void;
  onModalClose: () => void;
};

export default function ExperienceSection({
  experience,
  selectedJob,
  activeTech,
  onJobSelect,
  onModalClose,
}: Props) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const check = () => setDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Hover: a theme-adaptive neutral overlay (darkens on light, lightens on dark), no border/ring.
  const hoverBg = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";

  return (
    <>
      <div className={`space-y-0${selectedJob ? " pointer-events-none select-none" : ""}`}>
        {experience.map((job) => {
          const matched = !activeTech || matchesTech(job, activeTech);
          return (
            <div
              key={job.id}
              id={job.id}
              className="group scroll-mt-24 cursor-pointer rounded-xl p-5 -mx-5"
              style={{
                opacity: matched ? 1 : 0.2,
                borderLeft: matched && activeTech ? `3px solid ${BLUE}` : "3px solid transparent",
                transition:
                  "opacity 0.3s ease, border-color 0.3s ease, background-color 0.3s ease",
              }}
              onMouseEnter={(e) => { if (matched) (e.currentTarget as HTMLElement).style.backgroundColor = hoverBg; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; }}
              onClick={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; onJobSelect(job); }}
            >
              <div className="flex items-start mb-2">
                {job.logo ? (
                  <div className="flex-shrink-0 w-0 overflow-hidden transition-all duration-300 ease-out group-hover:w-10 group-hover:mr-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${BASE}${job.logo}`}
                      alt={job.company}
                      className="w-10 h-10 rounded-lg object-cover opacity-0 -translate-x-1 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-x-0"
                    />
                  </div>
                ) : null}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-4 mb-0.5">
                    <p className="font-semibold">{job.company}</p>
                    <p className="text-gray-400 text-sm whitespace-nowrap">{job.period}</p>
                  </div>
                  <p className="text-gray-500 text-sm">{job.title}</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed text-justify">{job.description}</p>
            </div>
          );
        })}
      </div>

      <DetailModal
        detail={selectedJob ? jobToDetail(selectedJob, activeTech) : null}
        onClose={onModalClose}
      />
    </>
  );
}
