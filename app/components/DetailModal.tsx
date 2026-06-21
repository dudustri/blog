"use client";

import Link from "next/link";

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

// Single popup used across the resume: Professional Experience, Education and
// Extra all render through this. Only the fields they pass get shown.
export type Detail = {
  title: string;
  subtitle?: string;
  meta?: string; // right-aligned, e.g. a period
  logo?: string; // path under /public
  website?: string; // makes the title a link
  description?: string;
  details?: string; // blank lines split it into paragraphs
  highlights?: string[];
  projects?: { slug: string; title: string }[];
  stack?: string[];
  activeTech?: string | null; // highlights the matching stack chip
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
  if (!detail) return null;

  const titleNode = detail.website ? (
    <a
      href={detail.website}
      target="_blank"
      rel="noopener noreferrer"
      style={{ fontWeight: 700, fontSize: 20, color: BLUE }}
      className="hover:underline"
    >
      {detail.title}
    </a>
  ) : (
    <p style={{ fontWeight: 700, fontSize: 20, color: BLUE }}>{detail.title}</p>
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

        {detail.description ? (
          <p className="text-gray-700 text-sm leading-relaxed text-justify">
            {highlightKeywords(detail.description)}
          </p>
        ) : null}

        {detail.details
          ? detail.details.split(/\n\s*\n/).map((para, i) => (
              <p key={i} className="text-gray-700 text-sm leading-relaxed text-justify mt-4">
                {highlightKeywords(para)}
              </p>
            ))
          : null}

        {detail.highlights?.length ? (
          <ul className="mt-4 space-y-2">
            {detail.highlights.map((h, i) => (
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
          <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid #ececec" }}>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
              Tech &amp; tools used
            </p>
            <div className="flex flex-wrap gap-2">
              {detail.stack.map((tech) => {
                const active = tech === detail.activeTech;
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
