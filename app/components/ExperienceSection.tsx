"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Experience } from "@/app/data/resume";

const BLUE = "#3e6b89";
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const KEYWORDS = [
  "C++", "C#", " C ", "Python", "TypeScript", "JavaScript", "Node",
  "Golang", "Rust", "Docker", "Kubernetes", "K8s", "AWS", "GCP",
  "REST", "GraphQL", "gRPC", "MQTT", "ESP32", "ESP IDF", "Redis",
  "PostgreSQL", "MySQL", "CI/CD", "TDD", "OTA", "Git", "GitHub Actions",
  "Linux", "Bash", "Flutter", "Dart", "LoRaWAN", "Modbus", "Scrum",
  "IoT", "HVAC", "LEED", "FCR-D", "Bun", "Make", "Cloud",
];

// Builds a case-insensitive regex pattern for a keyword.
// Trims surrounding spaces (handles " C ").
// Single-letter alpha keywords (e.g. "C") get a negative lookahead so they
// don't match "C++" or "C#" while still matching "C," / "C." / "C " etc.
function buildKeywordPattern(keyword: string): string {
  const k = keyword.trim();
  const esc = k.replace(/[+#.*?()[\]{}|\\]/g, "\\$&");
  if (/^[A-Za-z]$/.test(k)) {
    return `\\b${esc}(?![\\w+#])`;
  }
  const pre = /^\w/.test(k) ? "\\b" : "";
  const suf = /\w$/.test(k) ? "\\b" : "(?!\\w)";
  return `${pre}${esc}${suf}`;
}

function highlightKeywords(text: string) {
  const pattern = new RegExp(`(${KEYWORDS.map(buildKeywordPattern).join("|")})`, "gi");
  const parts = text.split(pattern);
  return parts.map((part, i) => {
    const isKeyword = KEYWORDS.some((k) => k.trim().toLowerCase() === part.toLowerCase());
    return isKeyword ? (
      <span key={i} style={{ color: BLUE, fontWeight: 500 }}>{part}</span>
    ) : (
      <span key={i}>{part}</span>
    );
  });
}


// Hard match against the job's curated `stack` (hardcoded in content/resume.json),
// instead of grepping the free-text description.
function matchesTech(job: Experience, tech: string): boolean {
  return job.stack?.includes(tech) ?? false;
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

  const hoverBg = dark ? "#252525" : "#f9fafb";

  return (
    <>
      <div className="space-y-8">
        {experience.map((job) => {
          const matched = !activeTech || matchesTech(job, activeTech);
          return (
            <div
              key={job.id}
              id={job.id}
              className="scroll-mt-24 cursor-pointer rounded-xl p-3 -mx-3"
              style={{
                opacity: matched ? 1 : 0.2,
                borderLeft: matched && activeTech ? `3px solid ${BLUE}` : "3px solid transparent",
                transition: "opacity 0.3s ease, border-color 0.3s ease",
              }}
              onMouseEnter={(e) => { if (matched) (e.currentTarget as HTMLElement).style.backgroundColor = hoverBg; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; }}
              onClick={() => onJobSelect(job)}
            >
              <div className="flex items-baseline justify-between gap-4 mb-0.5">
                <p className="font-semibold">{job.company}</p>
                <p className="text-gray-400 text-sm whitespace-nowrap">{job.period}</p>
              </div>
              <p className="text-gray-500 text-sm mb-2">{job.title}</p>
              <p className="text-gray-600 text-sm leading-relaxed text-justify">{job.description}</p>
            </div>
          );
        })}
      </div>

      {selectedJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
          onClick={onModalClose}
        >
          <div
            className="bg-white rounded-2xl w-full p-6 sm:p-10"
            style={{
              maxWidth: 860,
              maxHeight: "85vh",
              overflowY: "auto",
              boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-6">
              {selectedJob.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${BASE}${selectedJob.logo}`}
                  alt={selectedJob.company}
                  className="flex-shrink-0 rounded-lg object-cover"
                  style={{ width: 56, height: 56 }}
                />
              ) : null}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-6 mb-1">
                  {selectedJob.website ? (
                    <a
                      href={selectedJob.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontWeight: 700, fontSize: 20, color: BLUE }}
                      className="hover:underline"
                    >
                      {selectedJob.company}
                    </a>
                  ) : (
                    <p style={{ fontWeight: 700, fontSize: 20, color: BLUE }}>{selectedJob.company}</p>
                  )}
                  <p className="text-gray-400 text-sm whitespace-nowrap">{selectedJob.period}</p>
                </div>
                <p className="text-gray-500 text-sm">{selectedJob.title}</p>
              </div>
            </div>

            {/* Description — always shown first */}
            <p className="text-gray-700 text-sm leading-relaxed text-justify">
              {highlightKeywords(selectedJob.description)}
            </p>

            {/* Complementary deep-dive (curated jobs only) */}
            {selectedJob.details ? (
              <p className="text-gray-700 text-sm leading-relaxed mt-4 text-justify">
                {highlightKeywords(selectedJob.details)}
              </p>
            ) : null}

            {/* Highlights */}
            {selectedJob.highlights?.length ? (
              <ul className="mt-4 space-y-2">
                {selectedJob.highlights.map((h, i) => (
                  <li key={i} className="flex gap-2.5 text-gray-700 text-sm leading-relaxed">
                    <span
                      className="flex-shrink-0 inline-block rounded-full"
                      style={{ width: 4, height: 4, marginTop: 8, background: BLUE }}
                    />
                    <span>{highlightKeywords(h)}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            {/* Team */}
            {selectedJob.team ? (
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
                  Team
                </p>
                <p className="text-gray-700 text-sm leading-relaxed">{selectedJob.team}</p>
              </div>
            ) : null}

            {/* Related portfolio projects */}
            {selectedJob.projects?.length ? (
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
                  Related projects
                </p>
                <div className="flex flex-col gap-1.5">
                  {selectedJob.projects.map((p) => (
                    <Link
                      key={p.slug}
                      href={`/portfolio/${p.slug}`}
                      onClick={onModalClose}
                      className="text-sm hover:underline"
                      style={{ color: BLUE, fontWeight: 500 }}
                    >
                      {p.title} →
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            {selectedJob.stack?.length ? (
              <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid #ececec" }}>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                  Tech &amp; tools used
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.stack.map((tech) => {
                    const active = tech === activeTech;
                    return (
                      <span
                        key={tech}
                        className="px-2.5 py-1 text-xs rounded border"
                        style={{
                          borderColor: active ? BLUE : `${BLUE}33`,
                          background: active ? BLUE : `${BLUE}0d`,
                          color: active ? "#fff" : BLUE,
                        }}
                      >
                        {tech}
                      </span>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
