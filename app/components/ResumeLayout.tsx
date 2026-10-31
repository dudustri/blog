"use client";

import { useState } from "react";
import ResumeSidebar from "./ResumeSidebar";
import ExperienceSection from "./ExperienceSection";
import DetailModal, { type Detail } from "./DetailModal";
import { experience, techStackGrouped, engineeringStackGrouped, education, languages, extra, others, jobMatches } from "@/app/data/resume";
import type { Experience } from "@/app/data/resume";

export default function ResumeLayout() {
  const [selectedJob, setSelectedJob] = useState<Experience | null>(null);
  const [activeTechs, setActiveTechs] = useState<string[]>([]);
  const [detail, setDetail] = useState<Detail | null>(null);

  const toggleTech = (tech: string) =>
    setActiveTechs((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech],
    );

  // the chips dim roles further down the page, often off screen, so the header
  // says what a click does and then what the current selection did
  const matchedJobs = experience.filter((j) => jobMatches(j, activeTechs)).length;

  // per section: tabs or label rows, and the open tab (kept while in rows)
  const [stackRows, setStackRows] = useState<Record<string, boolean>>({});
  const [stackTabs, setStackTabs] = useState<Record<string, number>>({});
  const showTab = (id: string, tab: number) => setStackTabs((p) => ({ ...p, [id]: tab }));
  const tabClass = (on: boolean) =>
    `border-b-2 px-2.5 py-2 text-xs transition-colors ${
      on ? "border-[var(--accent)] font-semibold text-[var(--accent)]" : "border-transparent text-gray-500 hover:text-[var(--accent)]"
    }`;

  const chip = (tech: string) => {
    const active = activeTechs.includes(tech);
    return (
      <button
        key={tech}
        onClick={() => toggleTech(tech)}
        aria-pressed={active}
        className="whitespace-nowrap px-2 py-[3px] text-[12.5px] skill-chip rounded transition-all duration-200 cursor-pointer"
        style={{
          borderColor: active ? "var(--accent-fill)" : undefined,
          background: active ? "var(--accent-fill)" : undefined,
          color: active ? "var(--on-accent)" : undefined,
        }}
      >
        {tech}
      </button>
    );
  };

  const sectionPicks = (groups: typeof techStackGrouped) =>
    activeTechs.filter((t) => groups.some((g) => g.items.includes(t)));

  const stackSection = (
    id: string,
    title: string,
    groups: typeof techStackGrouped,
  ) => (
    <section id={id} className="relative mt-12 pt-8 border-t border-gray-200">
      <div className="mb-2 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400">
          {title}
        </h2>
        {/* same hover-reveal icon as the sports page menu */}
        <span className="group relative flex items-center">
          <span
            tabIndex={0}
            role="button"
            aria-label="How the skills work"
            aria-describedby={`${id}-info`}
            className="text-gray-300 transition-colors hover:text-gray-500 focus-visible:text-gray-500"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9.2" />
              <path d="M12 11v5.2" />
              <path d="M12 7.6v.1" />
            </svg>
          </span>
          <span
            id={`${id}-info`}
            role="tooltip"
            className="pointer-events-none absolute right-0 top-full z-10 mt-2 w-max max-w-64 rounded-lg border border-gray-200 bg-white p-2.5 text-left text-xs leading-relaxed text-gray-500 opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100 sm:right-auto sm:left-6 sm:top-1/2 sm:mt-0 sm:-translate-y-1/2"
          >
            Click a skill to highlight the roles that used it.
          </span>
        </span>
        {/* own line under the title on phones, top right of the section from sm */}
        <div className="flex w-full justify-center sm:absolute sm:right-0 sm:top-8 sm:h-5 sm:w-auto sm:items-center">
        <div role="group" aria-label="Layout" className="flex overflow-hidden rounded-md border border-gray-200 text-[10px]">
          {(["Tabs", "Rows"] as const).map((v) => {
            const on = (v === "Rows") === !!stackRows[id];
            return (
              <button
                key={v}
                aria-pressed={on}
                onClick={() => setStackRows((p) => ({ ...p, [id]: v === "Rows" }))}
                className={`px-2 py-1 transition-colors ${
                  on ? "bg-[var(--accent-fill)] text-[var(--on-accent)]" : "text-gray-400 hover:text-[var(--accent)]"
                }`}
              >
                {v}
              </button>
            );
          })}
        </div>
        </div>
      </div>
      {/* fixed height so the chips don't jump when the selection line appears */}
      {/* counts and clears only this section's picks, roles reflect every pick */}
      <p className="mb-3 min-h-4 text-center text-xs text-gray-400">
        {sectionPicks(groups).length > 0 && (
          <>
            {sectionPicks(groups).length} selected · {matchedJobs} of {experience.length}{" "}
            {experience.length === 1 ? "role" : "roles"} ·{" "}
            <button
              onClick={() => setActiveTechs((prev) => prev.filter((t) => !sectionPicks(groups).includes(t)))}
              className="transition-colors hover:text-[var(--accent)]"
            >
              Clear
            </button>
          </>
        )}
      </p>
      {stackRows[id] ? (
        // rows: every group as a label row
        <div key="rows" className="stack-fade">
          {groups.map((group) => (
            <div
              key={group.label}
              className="grid gap-2 py-2.5 sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-baseline sm:gap-4"
            >
              <p className="text-xs text-gray-500">{group.label}</p>
              <div className="flex flex-wrap gap-1.5">{group.items.map(chip)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div key="tabs" className="stack-fade">
          <div role="tablist" className="mb-4 flex flex-wrap justify-center">
            {groups.map((group, k) => {
              const on = (stackTabs[id] ?? 0) === k;
              // selections in other tabs stay visible as a count
              const picked = group.items.filter((t) => activeTechs.includes(t)).length;
              return (
                <button key={group.label} role="tab" aria-selected={on} onClick={() => showTab(id, k)} className={tabClass(on)}>
                  {group.label}
                  {picked > 0 && <span className="ml-1 text-[10px] font-semibold text-[var(--accent)]">· {picked}</span>}
                </button>
              );
            })}
          </div>
          <div key={stackTabs[id] ?? 0} role="tabpanel" className="stack-fade flex flex-wrap content-start justify-center gap-1.5">
            {groups[stackTabs[id] ?? 0].items.map(chip)}
          </div>
        </div>
      )}
    </section>
  );

  // one Extra category as its own separated section. "Software &
  // Technology Courses" has short titles, so it flows into up to three columns
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
      {/* career timeline, its own div, pinned to the extreme left and sitting
          entirely outside the content column (right-full + margin) so it never
          changes the centred content's width. Shown only when the left margin
          is wide enough to hold it. w-44 + mr-12 needs 224px, which the 896px
          content column only frees up from about 1344px, so it shows from 1400
          instead of xl (1280) where it used to clip off screen. */}
      <aside className="hidden min-[1400px]:block absolute right-full top-0 bottom-0 mr-12 w-44">
        <ResumeSidebar
          experience={experience}
          clickedJobId={selectedJob?.id ?? ""}
          onJobClick={(job) => setSelectedJob(job)}
        />
      </aside>

      {/* all content sections, same left edge throughout. Each section is
          split from the previous by a centered header over a top border line,
          matching the "Where I have worked" block above. */}
      <div className="min-w-0">

        {stackSection("techstack", "Tech Stack", techStackGrouped)}

        {stackSection("engineeringstack", "Engineering Stack", engineeringStackGrouped)}

        {/* professional Experience */}
        <section id="experience" className="mt-12 pt-8 border-t border-gray-200">
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

        {/* education */}
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

        {/* extra categories, minus Awards (placed after Languages below). */}
        {extra.filter((g) => g.category !== "Awards").map(renderExtraGroup)}

        {/* languages, short pairs, laid out in up to four columns. */}
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

        {/* awards, after Languages. */}
        {extra.filter((g) => g.category === "Awards").map(renderExtraGroup)}

        {/* others, affiliations, no popup */}
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
