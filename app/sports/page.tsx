"use client";

import { useState } from "react";
import {
  CATEGORY_META,
  Category,
  Aggregation,
  activities,
  categoryOf,
  filterActivities,
  statsFor,
  formatDuration,
  formatPace,
  formatDate,
  availableYears,
  MONTH_SHORT,
} from "@/app/data/activities";
import PizzaTracker from "./PizzaTracker";
import activitiesMeta from "@/content/activities-meta.json";

type View = "pizzas" | "activities";

// Overall lifetime numbers across everything.
const LIFETIME = statsFor(activities);
const YEARS = availableYears();

export default function SportsPage() {
  const [view, setView] = useState<View>("pizzas");
  const [active, setActive] = useState<Category>("running");
  const [aggregation, setAggregation] = useState<Aggregation>("monthly");
  const [year, setYear] = useState<number | "all">("all");
  const [month, setMonth] = useState<number | "all">("all");

  const meta = CATEGORY_META.find((m) => m.key === active)!;
  // Year/month filters drive both views; the activity list is then narrowed
  // to the selected category.
  const filtered = filterActivities(year, month);
  const list = filtered.filter((a) => categoryOf(a) === active);
  const stats = statsFor(list);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Hero */}
      <header className="mb-10">
        <p
          className="text-xs font-semibold uppercase tracking-[0.2em] mb-3"
          style={{
            background: "linear-gradient(90deg, #2a5a7a, #3e6b89)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Training Log
        </p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
          Sports
        </h1>
        <p className="text-gray-500 leading-relaxed max-w-xl text-[15px]">
          All my recorded activities since I got my Garmin watch — the full
          history, sorted by sport.
        </p>
        <p className="text-xs text-gray-400 mt-3">
          Last updated: {formatDate(activitiesMeta.generatedAt)}{" "}
          <span className="italic">
            (manually updated — I&apos;m not paying Strava for the API o.O)
          </span>
        </p>
      </header>

      {/* Lifetime banner */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <StatTile label="Total sessions" value={LIFETIME.count.toString()} />
        <StatTile
          label="Distance moved"
          value={`${Math.round(LIFETIME.distanceKm).toLocaleString()} km`}
          sub={`≈ ${((LIFETIME.distanceKm / 40075) * 100).toFixed(2)}% around Earth`}
        />
        <StatTile
          label="Time sweating"
          value={formatDuration(LIFETIME.movingTimeSec)}
        />
        <StatTile
          label="Vertical climbed"
          value={`${Math.round(LIFETIME.elevationM).toLocaleString()} m`}
        />
      </section>

      {/* View switch + shared filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        {/* Pizzas Earned ↔ Activities */}
        <div className="inline-flex rounded-lg border border-gray-200 p-0.5">
          {(
            [
              ["pizzas", "Pizzas Earned"],
              ["activities", "Activities"],
            ] as const
          ).map(([key, label]) => {
            const isOn = view === key;
            return (
              <button
                key={key}
                onClick={() => setView(key)}
                className={`min-w-[8rem] text-center px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isOn ? "bg-black text-white" : "text-gray-500 hover:text-black"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Filters (year/month apply to both views; aggregation is plot-only) */}
        <div className="flex flex-wrap items-center gap-3">
          {view === "pizzas" && (
            <div className="inline-flex rounded-lg border border-gray-200 p-0.5">
              {(["daily", "monthly"] as const).map((mode) => {
                const isOn = aggregation === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => setAggregation(mode)}
                    className={`px-3.5 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                      isOn
                        ? "bg-black text-white"
                        : "text-gray-500 hover:text-black"
                    }`}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>
          )}

          {/* Year selector */}
          <select
            value={year}
            onChange={(e) =>
              setYear(e.target.value === "all" ? "all" : Number(e.target.value))
            }
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 bg-white hover:border-gray-400 transition-colors"
          >
            <option value="all">All years</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Month selector */}
          <select
            value={month}
            onChange={(e) =>
              setMonth(
                e.target.value === "all" ? "all" : Number(e.target.value),
              )
            }
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 bg-white hover:border-gray-400 transition-colors"
          >
            <option value="all">All months</option>
            {MONTH_SHORT.map((label, idx) => (
              <option key={label} value={idx}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {view === "pizzas" ? (
        /* Pizza tracker */
        <section className="mb-12">
          <PizzaTracker aggregation={aggregation} year={year} month={month} />
        </section>
      ) : (
        /* Activities list */
        <>
          {/* Category tabs */}
          <nav className="flex flex-wrap gap-2 mb-8">
            {CATEGORY_META.map((m) => {
              const isActive = m.key === active;
              return (
                <button
                  key={m.key}
                  onClick={() => setActive(m.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "text-white border-transparent shadow-sm -translate-y-0.5"
                      : "border-gray-200 text-gray-500 hover:text-black hover:border-gray-400"
                  }`}
                  style={isActive ? { background: m.accent } : undefined}
                >
                  {m.label}
                </button>
              );
            })}
          </nav>

          {/* Active category panel */}
          <section
            className="border border-gray-200 rounded-2xl p-6 md:p-8 mb-6"
            style={{ borderTop: `3px solid ${meta.accent}` }}
          >
            <div className="mb-6">
              <h2
                className="text-2xl font-bold tracking-tight"
                style={{ color: meta.accent }}
              >
                {meta.label}
              </h2>
            </div>

            {stats.count === 0 ? (
              <p className="text-gray-400 text-sm">
                Nothing recorded in this range.
              </p>
            ) : (
              <>
                {/* Per-category stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-7">
                  <MiniStat label="Sessions" value={stats.count.toString()} />
                  <MiniStat
                    label="Distance"
                    value={
                      stats.distanceKm > 0
                        ? `${stats.distanceKm.toFixed(1)} km`
                        : "—"
                    }
                  />
                  <MiniStat
                    label="Moving time"
                    value={formatDuration(stats.movingTimeSec)}
                  />
                  <MiniStat
                    label="Elevation"
                    value={
                      stats.elevationM > 0
                        ? `${Math.round(stats.elevationM)} m`
                        : "—"
                    }
                  />
                </div>

                {/* Activity list */}
                <ul className="divide-y divide-gray-100">
                  {list.map((a) => (
                    <li
                      key={a.id}
                      className="py-3 flex items-center justify-between gap-4 group"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate group-hover:underline">
                          {a.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatDate(a.date)} · {a.type}
                          {a.avgHeartrate ? ` · ${a.avgHeartrate} bpm` : ""}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-sm font-semibold tabular-nums">
                          {a.distanceKm > 0
                            ? `${a.distanceKm.toFixed(1)} km`
                            : formatDuration(a.movingTimeSec)}
                        </p>
                        <p className="text-xs text-gray-400 tabular-nums">
                          {a.distanceKm > 0
                            ? formatPace(a.distanceKm, a.movingTimeSec)
                            : formatDuration(a.movingTimeSec)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="border border-gray-200 rounded-xl p-4">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-xl font-bold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg px-3 py-2.5">
      <p className="text-[11px] text-gray-400 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-base font-bold tabular-nums">{value}</p>
    </div>
  );
}
