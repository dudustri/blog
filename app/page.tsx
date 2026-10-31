"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import MatterBanner from "@/app/components/MatterBanner";
import { projects } from "@/app/data/portfolio";
import { posts, formatDmyDate } from "@/app/data/blog";
import { experience, education } from "@/app/data/resume";
import { countries } from "@/app/data/mundo";
import { activities, statsFor } from "@/app/data/activities";
import { now } from "@/app/data/about";

// live micro-stats from the same data the individual pages use, so each card
// shows one real number instead of an empty arrow
const companyCount = new Set(experience.map((e) => e.company)).size;
const degreeCount = new Set(education.map((e) => e.degree)).size;
const activityCount = statsFor(activities).count;
const published = posts.filter((p) => !p.draft);
const recentPosts = published.slice(0, 3);

const cards = [
  { href: "/about", label: "About", desc: "Who I am away from the resume", stat: `${now[0]?.entries.length ?? 0} things going on right now` },
  { href: "/resume", label: "Resume", desc: "Skills, experience & education", stat: `${companyCount} companies · ${degreeCount} degrees` },
  { href: "/portfolio", label: "Portfolio", desc: "Projects I've built or aiming to build", stat: `${projects.length} projects (WIP)` },
  { href: "/mundo", label: "Mundo", desc: "Places I have been hanging around ", stat: `${countries.length} countries visited` },
  { href: "/sports", label: "Sports", desc: "Activities, pizzas earned and stats", stat: `${activityCount.toLocaleString()} recorded activities` },
  { href: "/blog", label: "Blog", desc: "Random thoughts & cool things", stat: `${published.length} ${published.length === 1 ? "post" : "posts"}` },
  { href: "/contact", label: "Contact", desc: "Get in touch", stat: "replies asap !" },
];

const bio =
  "Copenhagen based. Software & firmware, distributed systems & cloud architecture, passion for concurrency, and domain expertise in power systems, electronics, industrial plants, and HVAC.";

// the current work, not the current employer. survives a job change, and
// /resume already carries the employment record
const current =
  "Currently building fast data acquisition and controls on the edge for wind and solar plants, plus cool stuff on the internet whenever a hobby takes over.";

const socials = [
  { href: "https://github.com/dudustri", label: "GitHub ↗" },
  { href: "https://linkedin.com/in/eduardo-sfreddo-trindade", label: "LinkedIn ↗" },
];

// brand marks, so the mobile buttons read at a glance instead of as grey text
const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  GitHub: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  ),
  LinkedIn: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
};


export default function Home() {
  const [photoToast, setPhotoToast] = useState(false);

  // while the photo note is open, any click elsewhere dismisses it. photo's
  // own click stops propagation so it toggles instead of instantly closing
  useEffect(() => {
    if (!photoToast) return;
    const close = () => setPhotoToast(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [photoToast]);

  return (
    <div className="w-full max-w-6xl mx-auto px-6 relative">
      {/* hero */}
      <section className="pt-16 pb-14 select-none">
        <div className="flex flex-row items-start gap-5 md:gap-10">
        <div className="flex-1 min-w-0">
          <p
            className="eyebrow text-xs font-semibold uppercase tracking-[0.2em] mb-4"
          >
            Software &amp; Energy Engineer
          </p>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-5 md:whitespace-nowrap">
            Eduardo Sfreddo Trindade
          </h1>
          {/* desktop: bio + links live in the text column beside the photo */}
          <p className="hidden md:block text-gray-500 leading-relaxed max-w-xl text-[13px]">
            {bio} {current}
          </p>
          <div className="hidden md:flex gap-3 mt-8">
            {socials.map((s) => {
              const name = s.label.replace(" \u2197", "");
              return (
                <a
                  key={s.href}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-gray-400 hover:text-black"
                >
                  {SOCIAL_ICONS[name]}
                  {name}
                </a>
              );
            })}
          </div>
        </div>

        {/* avatar */}
        <div className="relative flex-shrink-0 md:-ml-10 md:mt-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/images/avatar.jpg`}
            alt="Eduardo Sfreddo Trindade"
            className="w-24 h-24 sm:w-40 sm:h-40 md:w-52 md:h-52 rounded-2xl sm:rounded-3xl object-cover select-none cursor-pointer"
            onClick={(e) => { e.stopPropagation(); setPhotoToast((v) => !v); }}
          />

          {/* photo toast, top-right of the photo */}
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

        {/* mobile: bio spans full width, links centered on screen */}
        <p className="md:hidden text-gray-500 leading-normal text-[13px] mt-6">
          {bio} {current}
        </p>
        <div className="md:hidden flex gap-3 mt-7">
          {socials.map((s) => {
            const name = s.label.replace(" ↗", "");
            return (
              <a
                key={s.href}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:border-gray-400 hover:text-black"
              >
                {SOCIAL_ICONS[name]}
                {name}
              </a>
            );
          })}
        </div>
      </section>

      {/* nav cards */}
      <section className="pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="nav-card group border border-gray-200 rounded-xl p-5"
            >
              <p className="card-hint font-semibold text-sm mb-1 transition-colors duration-200">{card.label}</p>
              <p className="text-gray-500 text-xs leading-relaxed">{card.desc}</p>
              <div className="mt-4">
                <span className="card-hint block min-w-0 truncate font-mono text-[11px] text-gray-400 transition-colors duration-200">
                  {card.stat}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* latest writing, so the page has something that changes between visits */}
      {recentPosts.length > 0 && (
        <section className="pb-4">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-sm font-semibold">Latest writing</h2>
            <Link
              href="/blog"
              className="text-xs text-gray-400 hover:text-black transition-colors"
            >
              See all posts
            </Link>
          </div>
          <ul className="divide-y divide-gray-100 border-y border-gray-100">
            {recentPosts.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
                >
                  <span className="min-w-0">
                    <span className="card-hint text-sm font-medium transition-colors duration-200">
                      {post.title}
                    </span>
                    <span className="block text-xs text-gray-500 leading-relaxed mt-0.5">
                      {post.excerpt}
                    </span>
                  </span>
                  <time className="flex-shrink-0 font-mono text-[11px] text-gray-400">
                    {formatDmyDate(post.date)}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* closing CTA banner, gravity + cursor-repelling squares (Matter.js).
          Home page only. Extra top margin separates it from the nav cards; a
          small bottom padding keeps it just off the footer. On touch the squares fall
          and scatter on swipe; fewer squares on narrow screens. */}
      <section className="mt-16 pb-12 select-none">
        <MatterBanner
          title={<>From kilowatts to Kubernetes.</>}
          subtitle="Software across energy and industrial systems, embedded devices and cloud applications."
          ctaHref="/contact"
          ctaLabel="Get in touch"
        />
      </section>
    </div>
  );
}
