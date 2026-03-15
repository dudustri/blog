"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const cards = [
  { href: "/resume", label: "Resume", desc: "Skills, experience & education" },
  { href: "/portfolio", label: "Portfolio", desc: "Projects I've built or aiming to build" },
  { href: "/blog", label: "Blog", desc: "Random thoughts & cool things" },
  { href: "/contact", label: "Contact", desc: "Get in touch" },
];

export default function Home() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const check = () => setDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const cardHoverBg = dark ? "#252525" : "#f9fafb";
  const cardHoverBorder = dark ? "#555" : "#9ca3af";
  const cardHoverShadow = dark ? "0 2px 12px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.07)";
  const arrowHoverColor = "#3e6b89";

  return (
    <div className="max-w-6xl mx-auto px-6 relative">
      {/* Animated background blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div
          style={{
            position: "absolute",
            top: "-80px",
            left: "-60px",
            width: "280px",
            height: "280px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(62,107,137,0.2) 0%, transparent 70%)",
            animation: "blobFloat1 16s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "180px",
            right: "-80px",
            width: "240px",
            height: "240px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(30,74,106,0.15) 0%, transparent 70%)",
            animation: "blobFloat2 20s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-20px",
            left: "40%",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(62,107,137,0.13) 0%, transparent 70%)",
            animation: "blobFloat3 24s ease-in-out infinite",
          }}
        />
      </div>

      {/* Hero */}
      <section className="pt-16 pb-14 flex flex-col md:flex-row md:items-start md:justify-between gap-10">
        <div className="flex-1">
          <p
            className="text-xs font-semibold uppercase tracking-[0.2em] mb-4"
            style={{
              background: "linear-gradient(90deg, #2a5a7a, #3e6b89)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Software &amp; Energy Engineer
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-6 whitespace-nowrap">
            Eduardo Sfreddo Trindade
          </h1>
          <p className="text-gray-500 leading-relaxed max-w-sm text-[15px]">
            Software engineering, cloud systems, and DevOps — with a background in power systems,
            industrial plants, and HVAC.
          </p>
          <div className="flex gap-4 mt-8">
            <a
              href="https://github.com/dudustri"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-black transition-colors"
            >
              GitHub ↗
            </a>
            <a
              href="https://linkedin.com/in/eduardo-sfreddo-trindade"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-black transition-colors"
            >
              LinkedIn ↗
            </a>
          </div>
        </div>

        {/* Avatar */}
        <div className="flex-shrink-0">
          <div
            className="w-28 h-28 md:w-36 md:h-36 rounded-full flex items-center justify-center select-none"
            style={{ background: "linear-gradient(135deg, #1e3a5f, #3e6b89)" }}
          >
            <span className="text-2xl md:text-3xl font-bold tracking-tight text-white">EST</span>
          </div>
        </div>
      </section>

      {/* Nav cards */}
      <section className="pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group border border-gray-200 rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5"
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = cardHoverBorder;
                el.style.background = cardHoverBg;
                el.style.boxShadow = cardHoverShadow;
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "";
                el.style.background = "";
                el.style.boxShadow = "";
              }}
            >
              <p className="font-semibold text-sm mb-1">{card.label}</p>
              <p className="text-gray-500 text-xs leading-relaxed">{card.desc}</p>
              <p
                className="text-sm mt-4 transition-colors duration-200"
                style={{ color: "#d1d5db" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = arrowHoverColor)
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = "#d1d5db")
                }
              >
                →
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
