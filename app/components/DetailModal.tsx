"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { chipMatchesSelected } from "@/app/data/resume";

const BLUE = "#3e6b89";
// Two-tier keyword highlight, each shade tuned per theme:
//  - green  = tech tools and languages (what I used)
//  - accent  = quantified impact, awards and standards (what I achieved)
const GREEN_LIGHT = "#5c9c08";
const GREEN_DARK = "#a3e635";
const ACCENT_LIGHT = "#1d80c4"; // brighter azure so a single word pops against gray body text
const ACCENT_DARK = "#89cff0"; // baby blue
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// Tech tools and languages -> green.
const KEYWORDS = [
  "C++", "C#", " C ", "Java", "Python", "TypeScript", "JavaScript", "JS/TS", "React", "Node",
  "Golang", "Rust", "Docker", "Nginx", "Kubernetes", "K8s", "AWS", "GCP", "Azure",
  "REST", "GraphQL", "gRPC", "APIs", "API", "CLI", "MQTT", "ESP32", "ESP-IDF", "ESP IDF", "Bluetooth", "WiFi", "NB-IoT", "LTE",
  "Streamlit", "Dash", "Panel", "Marimo",
  "Redis", "PostgreSQL", "MySQL", "MongoDB", "NoSQL", "SQL",
  "CI/CD", "TDD", "OTA", "GitHub Actions", "GitLab", "Git", "Sourcetree", "Postman", "Android Studio",
  "Linux", "Bash", "USB", "Flutter", "Dart", "LoRaWAN", "Modbus", "Scrum",
  "IoT", "HVAC", "VRF", "EnergyPlus", "OpenStudio", "Dialux", "DIVA", "Bun", "Make", "Cloud",
];

// Awards, standards and scale words -> accent (percentages are matched by regex).
const ACCENT_TERMS = ["Innovation Prize", "LEED Platinum", "NBR 15575", "ASHRAE", "FCR-D", "LEED", "thousands"];
const PERCENT_SRC = "\\d+(?:\\s+to\\s+\\d+)?%"; // e.g. "20%", "1 to 3%"

// Builds a case-insensitive regex pattern for a keyword.
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

const GREEN_SET = new Set(KEYWORDS.map((k) => k.trim().toLowerCase()));
const ACCENT_SET = new Set(ACCENT_TERMS.map((k) => k.trim().toLowerCase()));
const PERCENT_RE = new RegExp(`^${PERCENT_SRC}$`, "i");
// Accent patterns come first so multi-word ones (e.g. "LEED Platinum") and
// percentages win over any shorter overlap.
const HIGHLIGHT_RE = new RegExp(
  `(${[PERCENT_SRC, ...ACCENT_TERMS.map(buildKeywordPattern), ...KEYWORDS.map(buildKeywordPattern)].join("|")})`,
  "gi",
);

function classify(part: string): "green" | "accent" | null {
  const p = part.trim();
  if (PERCENT_RE.test(p)) return "accent";
  const low = p.toLowerCase();
  if (ACCENT_SET.has(low)) return "accent";
  if (GREEN_SET.has(low)) return "green";
  return null;
}

function highlightKeywords(text: string, green: string, accent: string) {
  return text.split(HIGHLIGHT_RE).map((part, i) => {
    const cls = classify(part ?? "");
    if (cls === "accent") return <span key={i} style={{ color: accent, fontWeight: 600 }}>{part}</span>;
    if (cls === "green") return <span key={i} style={{ color: green, fontWeight: 600 }}>{part}</span>;
    return <span key={i}>{part}</span>;
  });
}

// Single popup used across the resume: Professional Experience, Education and
// Extra all render through this. Only the fields they pass get shown.
export type Detail = {
  title: string;
  subtitle?: string;
  impact?: string; // one-line outcome, bold above the description
  meta?: string; // right-aligned, e.g. a period
  logo?: string; // path under /public
  website?: string; // makes the title a link
  description?: string;
  details?: string; // blank lines split it into paragraphs
  highlights?: string[];
  projects?: { slug: string; title: string }[];
  stack?: string[];
  activeTechs?: string[]; // highlights the matching stack chips
  courses?: { name: string; summary: string; hours?: string; grade?: string }[];
  gradeScale?: string;
};

export default function DetailModal({
  detail,
  onClose,
}: {
  detail: Detail | null;
  onClose: () => void;
}) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const check = () => setDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  if (!detail) return null;

  const green = dark ? GREEN_DARK : GREEN_LIGHT;
  const accent = dark ? ACCENT_DARK : ACCENT_LIGHT;
  const hairline = dark ? "#333" : "#ececec";
  // Company name matches the list: strong black on light, white on dark.
  const titleColor = dark ? "#e5e5e5" : "#111111";

  const titleNode = detail.website ? (
    <a
      href={detail.website}
      target="_blank"
      rel="noopener noreferrer"
      style={{ fontWeight: 700, fontSize: 20, color: titleColor }}
      className="cursor-pointer"
    >
      {detail.title}
    </a>
  ) : (
    <p style={{ fontWeight: 700, fontSize: 20, color: titleColor }}>{detail.title}</p>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none cursor-default"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
      onClick={onClose}
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
          {detail.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`${BASE}${detail.logo}`}
              alt={detail.title}
              className="flex-shrink-0 rounded-lg object-cover"
              style={{ width: 56, height: 56 }}
            />
          ) : null}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-6 mb-1">
              {titleNode}
              {detail.meta ? (
                <p className="text-gray-400 text-sm whitespace-nowrap">{detail.meta}</p>
              ) : null}
            </div>
            {detail.subtitle ? (
              <p className="text-gray-500 text-sm">{detail.subtitle}</p>
            ) : null}
          </div>
        </div>

        {detail.impact ? (
          <p className="text-sm font-semibold mb-3" style={{ color: BLUE }}>
            {detail.impact}
          </p>
        ) : null}

        {detail.description ? (
          <p className="text-gray-700 text-sm leading-relaxed text-justify">
            {highlightKeywords(detail.description, green, accent)}
          </p>
        ) : null}

        {detail.details
          ? detail.details.split(/\n\s*\n/).map((para, i) => (
              <p key={i} className="text-gray-700 text-sm leading-relaxed text-justify mt-4">
                {highlightKeywords(para, green, accent)}
              </p>
            ))
          : null}

        {detail.highlights?.length ? (
          <div style={{ marginTop: 28, paddingTop: 20, borderTop: `1px solid ${hairline}` }}>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
              Highlights
            </p>
            <ul className="space-y-2">
              {detail.highlights.map((h, i) => (
                <li key={i} className="flex gap-2.5 text-gray-700 text-sm leading-relaxed">
                  <span
                    className="flex-shrink-0 inline-block rounded-full"
                    style={{ width: 4, height: 4, marginTop: 8, background: BLUE }}
                  />
                  <span>{highlightKeywords(h, green, accent)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {detail.courses?.length ? (
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
              Courses
            </p>
            {detail.gradeScale ? (
              <p className="text-gray-400 text-xs mb-3">{detail.gradeScale}</p>
            ) : (
              <div className="mb-3" />
            )}
            <div className="space-y-3">
              {detail.courses.map((c, i) => (
                <div key={i}>
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-gray-700 text-sm font-medium">{c.name}</p>
                    {c.hours || c.grade ? (
                      <p className="flex-shrink-0 text-gray-400 text-xs whitespace-nowrap">
                        {[c.hours, c.grade].filter(Boolean).join(" · ")}
                      </p>
                    ) : null}
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed text-justify">{c.summary}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {detail.projects?.length ? (
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
              Related projects
            </p>
            <div className="flex flex-col gap-1.5">
              {detail.projects.map((p) => (
                <Link
                  key={p.slug}
                  href={`/portfolio/${p.slug}`}
                  onClick={onClose}
                  className="text-sm hover:underline"
                  style={{ color: BLUE, fontWeight: 500 }}
                >
                  {p.title} →
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {detail.stack?.length ? (
          <div style={{ marginTop: 28, paddingTop: 20, borderTop: `1px solid ${hairline}` }}>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
              Tech &amp; tools used
            </p>
            <div className="flex flex-wrap gap-2">
              {/* Always show C and C++ as a single coupled chip. */}
              {Array.from(
                new Set(detail.stack.map((t) => (t === "C" || t === "C++" ? "C / C++" : t))),
              ).map((tech) => {
                const active = chipMatchesSelected(tech, detail.activeTechs ?? []);
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
  );
}
