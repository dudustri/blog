import type { Metadata } from "next";
import { intro, now, sections } from "@/app/data/about";
import { formatDate } from "@/app/data/blog";

const TITLE = "About";
const DESCRIPTION =
  "Who Eduardo Sfreddo Trindade is away from the resume, and what he is up to right now.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/about" },
};

export default function AboutPage() {
  const [current, ...archive] = now;

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold tracking-tight mb-3">About</h1>
      <p className="text-gray-500 text-[15px] leading-relaxed max-w-xl mb-12">{intro}</p>

      {/* the /now convention, a dated snapshot rather than a timeless bio */}
      {current ? (
        <section className="mb-12">
          <div className="flex items-baseline justify-between gap-4 mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
              Right now
            </h2>
            <time className="font-mono text-[11px] text-gray-400">
              {formatDate(current.date)}
            </time>
          </div>
          <ul className="space-y-2.5 border-y border-gray-100 py-5">
            {current.entries.map((e) => (
              <li key={e} className="flex gap-3 text-[15px] leading-relaxed text-gray-700">
                <span
                  aria-hidden="true"
                  className="mt-[9px] h-1 w-1 flex-shrink-0 rounded-full"
                  style={{ background: "#3e6b89" }}
                />
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mb-12 grid gap-8 sm:grid-cols-2">
        {sections.map((s) => (
          <div key={s.title}>
            <h2 className="font-semibold mb-1.5">{s.title}</h2>
            <p className="text-gray-600 text-[15px] leading-relaxed">{s.body}</p>
          </div>
        ))}
      </section>

      {/* old snapshots stay readable, that is the interesting part a year later */}
      {archive.length > 0 ? (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400 mb-5">
            Previously
          </h2>
          <div className="divide-y divide-gray-100 border-t border-gray-100">
            {archive.map((entry) => (
              <div key={entry.date} className="py-5">
                <time className="font-mono text-[11px] text-gray-400">
                  {formatDate(entry.date)}
                </time>
                <ul className="mt-2 space-y-1.5">
                  {entry.entries.map((e) => (
                    <li key={e} className="text-sm leading-relaxed text-gray-500">
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
