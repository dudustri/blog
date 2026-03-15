"use client";

import { useState, useEffect } from "react";
import type { Experience } from "@/app/data/resume";

const BLUE = "#3e6b89";

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


// TODO: build a hard match based on the tech stuff / skill / knowledge I used in the jobs or improve the description for automatic matching.
function matchesTech(job: Experience, tech: string): boolean {
  const pattern = new RegExp(buildKeywordPattern(tech), "i");
  return pattern.test(job.description) || pattern.test(job.title);
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
              <p className="text-gray-600 text-sm leading-relaxed">{job.description}</p>
            </div>
          );
        })}
      </div>

      {selectedJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
          onClick={onModalClose}
        >
          <div
            className="bg-white rounded-2xl w-full"
            style={{
              maxWidth: 860,
              maxHeight: "85vh",
              overflowY: "auto",
              boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
              padding: "40px 48px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
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
            <p className="text-gray-500 text-sm mb-6">{selectedJob.title}</p>
            <p className="text-gray-700 text-sm leading-relaxed">
              {highlightKeywords(selectedJob.description)}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
