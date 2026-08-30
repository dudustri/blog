"use client";

import { useState } from "react";
import ResumeSidebar from "./ResumeSidebar";
import ExperienceSection from "./ExperienceSection";
import DetailModal, { type Detail } from "./DetailModal";
import { experience, techStack, education, languages, extra, others } from "@/app/data/resume";
import type { Experience } from "@/app/data/resume";

export default function ResumeLayout() {
  const [selectedJob, setSelectedJob] = useState<Experience | null>(null);
  const [activeTechs, setActiveTechs] = useState<string[]>([]);
  const [detail, setDetail] = useState<Detail | null>(null);

  const toggleTech = (tech: string) =>
    setActiveTechs((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech],
    );

  // One Extra category rendered as its own separated section. "Software &
  // Technology Courses" has short titles, so it flows into up to three columns.
  const renderExtraGroup = (group: (typeof extra)[number]) => {
    const isCourses = group.category.toLowerCase().includes("courses");
    return (
      <section key={group.category} className="mt-16 pt-8 border-t border-gray-200">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 text-center mb-8">
          {group.category}
        </h2>
        <div
          className={
            isCourses
              ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1"
              : "space-y-1"
          }
        >
          {group.items.map((item) => (
            <div
              key={item.title}
              className={`resume-card flex items-baseline gap-2.5 text-sm text-gray-600 py-2 ${
                isCourses ? "px-3" : "px-3 -mx-3"
              }`}
              onClick={() =>
                setDetail({ title: item.title, subtitle: group.category, details: item.details })
              }
            >
              <span
                className="flex-shrink-0 inline-block rounded-full bg-gray-300"
                style={{ width: 4, height: 4, marginBottom: 1 }}
              />
              {item.title}
            </div>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="relative">
      {/* Career timeline — its own div, pinned to the extreme left and sitting
          entirely outside the content column (right-full + margin) so it never
          changes the centred content's width. Shown only when the left margin
          is wide enough to hold it. */}
      <aside className="hidden xl:block absolute right-full top-0 bottom-0 mr-8 lg:mr-12 w-44">
        <ResumeSidebar
          experience={experience}
          clickedJobId={selectedJob?.id ?? ""}
          onJobClick={(job) => setSelectedJob(job)}
        />
      </aside>

      {/* All content sections — same left edge throughout. Each section is
          split from the previous by a centered header over a top border line,
          matching the "Where I have worked" block above. */}
      <div className="min-w-0">

        {/* Tech Stack */}
        <section id="techstack" className="mt-16 pt-8 border-t border-gray-200">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 text-center mb-8">
            Tech Stack
          </h2>
          <div className="flex flex-wrap justify-center gap-2">
            {techStack.map((tech) => {
              const active = activeTechs.includes(tech);
              return (
                <button
                  key={tech}
                  onClick={() => toggleTech(tech)}
                  className="px-3 py-1 text-sm rounded border border-gray-200 text-gray-700 transition-all duration-200 cursor-pointer hover:border-[#3e6b89] hover:text-[#3e6b89] hover:bg-[#3e6b89]/[0.06]"
                  style={{
                    borderColor: active ? "#3e6b89" : undefined,
                    background: active ? "#3e6b89" : undefined,
                    color: active ? "#fff" : undefined,
                  }}
                >
                  {tech}
                </button>
              );
            })}
          </div>
        </section>

        {/* Professional Experience */}
        <section id="experience" className="mt-16 pt-8 border-t border-gray-200">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 text-center mb-8">
            Professional Experience
          </h2>
          <ExperienceSection
            experience={experience}
            selectedJob={selectedJob}
            activeTechs={activeTechs}
            onJobSelect={(job) => setSelectedJob(job)}
            onModalClose={() => setSelectedJob(null)}
          />
        </section>

        {/* Education */}
        <section id="education" className="mt-16 pt-8 border-t border-gray-200">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 text-center mb-8">
            Education
          </h2>
          <div className="space-y-0">
            {education.map((edu) => (
              <div
                key={edu.school}
                className="resume-card p-5 -mx-5"
                onClick={() =>
                  setDetail({
                    title: edu.school,
                    subtitle: edu.degree,
                    meta: edu.period,
                    description: edu.description || undefined,
                    courses: edu.courses,
                    gradeScale: edu.gradeScale,
                  })
                }
              >
                <div className="flex items-baseline justify-between gap-4">
                  <p className="font-medium">{edu.school}</p>
                  <p className="text-gray-400 text-sm whitespace-nowrap">{edu.period}</p>
                </div>
                <p className="text-gray-600 text-sm">{edu.degree}</p>
                {edu.description && (
                  <p className="text-gray-400 text-sm mt-0.5">{edu.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Extra categories, minus Awards (placed after Languages below). */}
        {extra.filter((g) => g.category !== "Awards").map(renderExtraGroup)}

        {/* Languages — short pairs, laid out in up to four columns. */}
        <section id="languages" className="mt-16 pt-8 border-t border-gray-200">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 text-center mb-8">
            Languages
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-4 justify-items-center text-center">
            {languages.map((lang) => (
              <div key={lang.name}>
                <p className="font-medium text-sm">{lang.name}</p>
                <p className="text-gray-500 text-xs mt-0.5">{lang.level}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Awards — after Languages. */}
        {extra.filter((g) => g.category === "Awards").map(renderExtraGroup)}

        {/* Others — affiliations, no popup */}
        <section id="others" className="mt-16 pt-8 border-t border-gray-200">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 text-center mb-8">
            Others
          </h2>
          <div className="space-y-1.5 text-sm text-gray-600 select-none cursor-default">
            {others.map((item) => (
              <div key={item} className="flex items-baseline gap-2.5">
                <span
                  className="flex-shrink-0 inline-block rounded-full bg-gray-300"
                  style={{ width: 4, height: 4, marginBottom: 1 }}
                />
                {item}
              </div>
            ))}
          </div>
        </section>

      </div>

      <DetailModal detail={detail} onClose={() => setDetail(null)} />
    </div>
  );
}
