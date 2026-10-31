import type { Metadata } from "next";
import { intro, notes, now, sections } from "@/app/data/about";
import { formatDmyDate } from "@/app/data/blog";
import { renderInline } from "@/app/components/InlineText";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
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
      {/* intro and the current snapshot on the left, the photo beside them */}
      <div className="mb-12 flex flex-col gap-8 lg:flex-row lg:items-stretch lg:gap-10">
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold tracking-tight mb-3">About</h1>
          <p className="text-gray-500 text-[15px] leading-relaxed">
            {renderInline(intro)}
          </p>
          {current ? (
            <p className="mt-3 text-xs text-gray-400">
              Last updated: <time>{formatDmyDate(current.date)}</time>
            </p>
          ) : null}
          {/* the /now convention, a dated snapshot rather than a timeless bio */}
          {current ? (
            <section className="mt-8">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                Currently
              </h2>
              <ul className="space-y-2.5 border-y border-gray-100 py-5">
                {current.entries.map((e) => (
                  <li
                    key={e}
                    className="flex gap-3 text-[15px] leading-relaxed text-gray-700"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-[9px] h-1 w-1 flex-shrink-0 rounded-full bg-[var(--accent)]"
                    />
                    <span>{renderInline(e)}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {/* old snapshots stay readable, that is the interesting part a year later */}
          {archive.length > 0 ? (
            <section className="mt-8">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)] mb-4">
                Previously
              </h2>
              <div className="divide-y divide-gray-100 border-y border-gray-100">
                {archive.map((entry) => (
                  <div key={entry.date} className="py-5">
                    <ul className="space-y-2.5">
                      {entry.entries.map((e) => (
                        <li
                          key={e}
                          className="flex gap-3 text-[15px] leading-relaxed text-gray-700"
                        >
                          <span
                            aria-hidden="true"
                            className="mt-[9px] h-1 w-1 flex-shrink-0 rounded-full bg-[var(--accent)]"
                          />
                          <span>{renderInline(e)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
        {/* stretches to the text column, ending level with the Previously divider */}
        <figure className="w-full max-w-md flex-shrink-0 lg:flex lg:w-80 lg:flex-col">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${BASE}/images/about.jpg`}
            alt="Eduardo standing in front of an indoor waterfall surrounded by plants"
            width={640}
            height={1203}
            className="w-full rounded-xl object-cover lg:h-0 lg:flex-grow"
          />
        </figure>
      </div>

      <section className="mb-12 grid gap-8 sm:grid-cols-2">
        {sections.map((s) => (
          <div key={s.title}>
            <h2 className="font-semibold mb-1.5">{s.title}</h2>
            <p className="text-gray-600 text-[15px] leading-relaxed">
              {renderInline(s.body, notes)}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
