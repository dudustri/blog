"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const cards = [
  { href: "/resume", label: "Resume", desc: "Skills, experience & education" },
  { href: "/portfolio", label: "Portfolio", desc: "Projects I've built or aiming to build" },
  { href: "/mundo", label: "Mundo", desc: "Places I have been hanging around "},
  { href: "/sports", label: "Sports", desc: "Activities, pizzas earned and stats" },
  { href: "/blog", label: "Blog", desc: "Random thoughts & cool things" },
  { href: "/contact", label: "Contact", desc: "Get in touch" },
];

const bio =
  "Software engineering, cloud systems, and DevOps with a background in power systems, industrial plants, and HVAC.";

const socials = [
  { href: "https://github.com/dudustri", label: "GitHub ↗" },
  { href: "https://linkedin.com/in/eduardo-sfreddo-trindade", label: "LinkedIn ↗" },
];

export default function Home() {
  const [dark, setDark] = useState(false);
  const [photoToast, setPhotoToast] = useState(false);

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

  return (
    <div className="max-w-6xl mx-auto px-6 relative">
      {/* Hero */}
      <section className="pt-16 pb-14 select-none">
        <div className="flex flex-row items-start gap-5 md:gap-10">
        <div className="flex-1 min-w-0">
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
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-6 md:whitespace-nowrap">
            Eduardo Sfreddo Trindade
          </h1>
          {/* Desktop: bio + links live in the text column beside the photo */}
          <p className="hidden md:block text-gray-500 leading-relaxed max-w-sm text-[15px]">
            {bio}
          </p>
          <div className="hidden md:flex gap-4 mt-8">
            {socials.map((s) => (
              <a
                key={s.href}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-400 hover:text-black transition-colors"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>

        {/* Avatar */}
        <div className="relative flex-shrink-0 md:-ml-10 md:mt-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/images/avatar.jpg`}
            alt="Eduardo Sfreddo Trindade"
            className="w-24 h-24 sm:w-40 sm:h-40 md:w-52 md:h-52 rounded-2xl sm:rounded-3xl object-cover select-none cursor-pointer"
            onClick={() => setPhotoToast(v => !v)}
          />

          {/* Photo toast — top-right of the photo */}
          {photoToast && (
            <div className="absolute z-50 bg-black text-white text-xs px-4 py-3 rounded-xl shadow-lg leading-relaxed top-full right-0 mt-3 w-[min(20rem,80vw)] md:top-1/2 md:right-auto md:left-full md:mt-0 md:ml-3 md:-translate-y-1/2 md:w-56">
              Nej, this is not AI generated (:
              <br />
              <br />
              This photo was taken by Daniel from DSH Media in a Novo Nordisk event at ITU.
              <br />
              <br />
              Check their website at{" "}
              <a
                href="https://dsh-media.dk"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-gray-300"
              >
                dsh-media.dk
              </a>
            </div>
          )}
        </div>
        </div>

        {/* Mobile: bio spans full width, links centered on screen */}
        <p className="md:hidden text-gray-500 leading-relaxed text-[15px] mt-6">
          {bio}
        </p>
        <div className="md:hidden flex justify-center gap-6 mt-8">
          {socials.map((s) => (
            <a
              key={s.href}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-black transition-colors"
            >
              {s.label}
            </a>
          ))}
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
              <p className="font-semibold text-sm mb-1 transition-colors duration-200 group-hover:text-[#3e6b89]">{card.label}</p>
              <p className="text-gray-500 text-xs leading-relaxed">{card.desc}</p>
              <p className="text-sm mt-4 text-gray-300 transition-all duration-200 group-hover:text-[#3e6b89] group-hover:translate-x-1">
                →
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
