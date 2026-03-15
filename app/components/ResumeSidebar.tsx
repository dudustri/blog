"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Experience } from "@/app/data/resume";

const BLUE = "#3e6b89";

const ICON_PALETTE = [
  { bg: "#DBEAFE", fg: "#1D4ED8" },
  { bg: "#D1FAE5", fg: "#047857" },
  { bg: "#EDE9FE", fg: "#6D28D9" },
  { bg: "#FEE2E2", fg: "#B91C1C" },
  { bg: "#FEF3C7", fg: "#B45309" },
  { bg: "#CFFAFE", fg: "#0E7490" },
  { bg: "#FCE7F3", fg: "#9D174D" },
];

function iconColor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % ICON_PALETTE.length;
  return ICON_PALETTE[Math.abs(h)];
}

function CompanyIcon({ company, active }: { company: string; active: boolean }) {
  const { bg, fg } = iconColor(company);
  return (
    <div
      style={{
        background: bg,
        color: fg,
        width: active ? 16 : 0,
        height: 16,
        borderRadius: 3,
        fontSize: 8,
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: active ? 1 : 0,
        overflow: "hidden",
        flexShrink: 0,
        marginRight: active ? 5 : 0,
        transition:
          "width 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease, margin-right 0.3s ease",
      }}
    >
      {company[0]}
    </div>
  );
}

function Dot({ active }: { active: boolean }) {
  return (
    <div
      style={{
        width: 10,
        height: 10,
        borderRadius: "50%",
        border: `2px solid ${active ? BLUE : "#D1D5DB"}`,
        background: active ? BLUE : "#fff",
        flexShrink: 0,
        transition:
          "border-color 0.4s ease, background 0.4s ease, transform 0.5s cubic-bezier(0.34,1.56,0.64,1)",
        transform: active ? "scale(1.35)" : "scale(1)",
      }}
    />
  );
}

const COL_W = 14;
const GAP = 8;

type Props = {
  experience: Experience[];
  clickedJobId: string;
  onJobClick: (job: Experience) => void;
};

export default function ResumeSidebar({ experience, clickedJobId, onJobClick }: Props) {
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const [topOffset, setTopOffset] = useState(24);

  const scrollActiveId = experience.find((j) => visibleIds.has(j.id))?.id ?? "";
  const activeId = clickedJobId || scrollActiveId;

  useEffect(() => {
    const recalc = () => {
      if (!containerRef.current) return;
      const h = containerRef.current.offsetHeight;
      const vh = window.innerHeight;
      setTopOffset(Math.max(24, Math.round((vh - h) / 2)));
    };
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleIds((prev) => {
          const next = new Set(prev);
          for (const e of entries) {
            if (e.isIntersecting) next.add(e.target.id);
            else next.delete(e.target.id);
          }
          return next;
        });
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0 }
    );
    for (const job of experience) {
      const el = document.getElementById(job.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [experience]);

  const handleJobClick = useCallback(
    (job: Experience) => {
      document.getElementById(job.id)?.scrollIntoView({ behavior: "smooth", block: "center" });
      onJobClick(job);
    },
    [onJobClick]
  );

  return (
    <div ref={containerRef} className="sticky h-fit select-none" style={{ top: topOffset }}>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-4">
        Career Timeline
      </p>

      {/* Timeline entries with single absolute connecting line */}
      <div style={{ position: "relative" }}>
        {/* Vertical line spanning the full list */}
        <div
          style={{
            position: "absolute",
            left: COL_W / 2 - 0.5,
            top: 0,
            bottom: 0,
            width: 1,
            background: "#E5E7EB",
          }}
        />

        {experience.map((job, idx) => {
          const active = activeId === job.id;
          const isLast = idx === experience.length - 1;

          return (
            <div
              key={job.id}
              style={{
                display: "flex",
                gap: GAP,
                cursor: "pointer",
                alignItems: "center",
                paddingBottom: isLast ? 4 : 36,
                paddingTop: idx === 0 ? 0 : 0,
              }}
              onClick={() => handleJobClick(job)}
            >
              {/* Dot — centered in the column, above the absolute line */}
              <div
                style={{
                  width: COL_W,
                  flexShrink: 0,
                  display: "flex",
                  justifyContent: "center",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <Dot active={active} />
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Icon + company name on the same row */}
                <div style={{ display: "flex", alignItems: "center" }}>
                  <CompanyIcon company={job.company} active={active} />
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: active ? 600 : 400,
                      color: active ? BLUE : "#9CA3AF",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      transition: "color 0.5s ease",
                    }}
                  >
                    {job.company}
                  </p>
                </div>
                {/* Period — slides in below */}
                <p
                  style={{
                    fontSize: 9,
                    color: "#9CA3AF",
                    overflow: "hidden",
                    maxHeight: active ? 20 : 0,
                    opacity: active ? 1 : 0,
                    transition: "max-height 0.4s ease, opacity 0.4s ease",
                  }}
                >
                  {job.period}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
