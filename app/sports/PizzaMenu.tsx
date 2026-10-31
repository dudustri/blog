"use client";

import { useEffect, useState } from "react";
import { foodMenuFor, PIZZA_CM, PIZZA_GRAMS, PIZZA_SOURCE } from "@/app/data/activities";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// picking a pizza changes what the plot counts as one, so the choice lives in
// the parent and this is a controlled list
export default function PizzaMenu({
  calories,
  selected,
  onSelect,
}: {
  calories: number;
  selected: string;
  onSelect: (name: string) => void;
}) {
  const menu = foodMenuFor(calories);
  // a new object per click so picking the same item restarts the half second
  const [flash, setFlash] = useState<{ src: string } | null>(null);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 500);
    return () => clearTimeout(t);
  }, [flash]);

  return (
    <div className="mt-8">
      {/* kept mounted so the browser already holds the file when it is needed,
          half a second is not long enough to fetch one */}
      {menu
        .filter((p) => p.flash)
        .map((p) => (
          <div
            key={p.name}
            aria-hidden="true"
            className={`pointer-events-none fixed inset-0 z-50 flex items-center justify-center ${
              flash?.src === p.flash ? "" : "invisible"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${BASE}${p.flash}`}
              alt=""
              className="w-[min(80vw,520px)] rounded-2xl shadow-2xl"
            />
          </div>
        ))}
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-sm font-semibold">The menu</h2>
        {/* same hover-reveal the mundo page uses for its asides */}
        <span className="group relative flex items-center">
          <span
            tabIndex={0}
            role="button"
            aria-label="How these numbers work"
            className="text-gray-300 transition-colors hover:text-gray-500 focus-visible:text-gray-500"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9.2" />
              <path d="M12 11v5.2" />
              <path d="M12 7.6v.1" />
            </svg>
          </span>
          <span className="pointer-events-none absolute left-6 top-1/2 z-10 w-64 -translate-y-1/2 rounded-lg border border-gray-200 bg-white p-2.5 text-xs leading-relaxed text-gray-500 opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
            Pick one and the plot recounts. Every pizza is {PIZZA_CM} cm and{" "}
            {PIZZA_GRAMS} g. Energy per 100 g is from {PIZZA_SOURCE.label}, portion sizes
            are my own guess.
          </span>
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {menu.map((p) => {
          const on = p.name === selected;
          return (
            <button
              key={p.name}
              onClick={() => {
                onSelect(p.name);
                if (p.flash) setFlash({ src: p.flash });
              }}
              aria-pressed={on}
              className={`flex items-baseline gap-3 rounded-xl border p-3 text-left transition-colors ${
                on
                  ? "border-[#3e6b89] bg-[#3e6b89]/[0.06]"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${BASE}/images/food/${p.icon}.png`}
                alt=""
                className="h-5 w-5 flex-shrink-0"
              />
              <span className="min-w-0 flex-1">
                <span className={`block text-sm ${on ? "font-semibold" : "font-medium"}`}>
                  {p.name}
                </span>
                <span className="block text-xs text-gray-400">{p.note}</span>
                <span className="mt-1 block font-mono text-[11px] text-gray-400 tabular-nums">
                  {p.kcal.toLocaleString()} kcal · {p.kj.toLocaleString()} kJ
                </span>
              </span>
              <span className="flex-shrink-0 text-right">
                <span className="block text-sm font-semibold tabular-nums">
                  {p.earned.toLocaleString()}
                </span>

              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
