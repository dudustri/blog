"use client";

import { useState } from "react";
import ResumeSidebar from "./ResumeSidebar";
import ExperienceSection from "./ExperienceSection";
import DetailModal, { type Detail } from "./DetailModal";
import { experience, techStack, education, languages, extra, others } from "@/app/data/resume";
import type { Experience } from "@/app/data/resume";

export default function ResumeLayout() {
  const [selectedJob, setSelectedJob] = useState<Experience | null>(null);
  const [activeTech, setActiveTech] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);

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

      {/* All content sections — same left edge throughout */}
      <div className="min-w-0 space-y-14">

        {/* Tech Stack */}
        <section id="techstack">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-5">
            Tech Stack
          </h2>
          <div className="flex flex-wrap gap-2">
            {techStack.map((tech) => {
              const active = activeTech === tech;
              return (
                <button
                  key={tech}
                  onClick={() => setActiveTech(active ? null : tech)}
                  className="px-3 py-1 text-sm rounded border transition-all duration-200 cursor-pointer"
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
        <section id="experience">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-5">
            Professional Experience
          </h2>
          <ExperienceSection
            experience={experience}
            selectedJob={selectedJob}
            activeTech={activeTech}
            onJobSelect={(job) => setSelectedJob(job)}
            onModalClose={() => setSelectedJob(null)}
          />
        </section>

        {/* Education */}
        <section id="education">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-5">
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

        {/* Languages */}
        <section id="languages">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-5">
            Languages
          </h2>
          <div className="space-y-2">
            {languages.map((lang) => (
              <div key={lang.name} className="flex gap-4 text-sm">
                <span className="font-medium w-24">{lang.name}</span>
                <span className="text-gray-500">{lang.level}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Extra */}
        <section id="extra">
          <div className="space-y-8">
            {extra.map((group) => (
              <div key={group.category}>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
                  {group.category}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <div
                      key={item.title}
                      className="resume-card flex items-baseline gap-2.5 text-sm text-gray-600 px-3 py-2 -mx-3"
                      onClick={() =>
                        setDetail({
                          title: item.title,
                          subtitle: group.category,
                          details: item.details,
                        })
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
              </div>
            ))}
          </div>
        </section>

        {/* Others — affiliations, no popup */}
        <section id="others">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-5">
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
