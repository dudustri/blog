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
  pizzaSummary,
  FOOD_MENU,
  foodKcal,
  PIZZA_KCAL,
  MONTH_SHORT,
} from "@/app/data/activities";
import PizzaTracker from "./PizzaTracker";
import PizzaMenu from "./PizzaMenu";
import activitiesMeta from "@/content/activities-meta.json";

type View = "pizzas" | "activities";

const PAGE = 10; // activities visible before "load more"

// overall lifetime numbers
const LIFETIME = statsFor(activities);
const YEARS = availableYears();

export default function SportsPage() {
  const [view, setView] = useState<View>("pizzas");
  // which pizza the plot counts as one
  const [pizza, setPizza] = useState("Margherita");
  const [active, setActive] = useState<Category>("running");
  const [aggregation, setAggregation] = useState<Aggregation>("monthly");
  const [year, setYear] = useState<number | "all">("all");
  const [month, setMonth] = useState<number | "all">("all");
  // long lists start short, the button below grows them
  const [shown, setShown] = useState(PAGE);

  const meta = CATEGORY_META.find((m) => m.key === active)!;
  // year/month filters drive both views, activity list is then narrowed to
  // the selected category
  const filtered = filterActivities(year, month);
  const list = filtered.filter((a) => categoryOf(a) === active);
  const stats = statsFor(list);
  // same kcal per item as the plot and the menu
  const picked = FOOD_MENU.find((p) => p.name === pizza);
  const pizzas = pizzaSummary(filtered, picked ? foodKcal(picked) : PIZZA_KCAL);

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-10 select-none">
      {/* hero */}
      <header className="mb-10">
        <p
          className="eyebrow text-xs font-semibold uppercase tracking-[0.2em] mb-3"
        >
          Training Log
        </p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
          Sports
        </h1>
        <p className="text-gray-500 leading-relaxed max-w-xl text-[15px]">
          All my recorded activities since I got my Garmin watch.
        </p>
        <p className="text-xs text-gray-400 mt-3">
          Last updated: {formatDate(activitiesMeta.generatedAt)}{" "}
          <span className="italic">
            (manually updated, I&apos;m not paying Strava for the API o.O)
          </span>
        </p>
      </header>

      {/* lifetime banner */}
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

      {/* view switch + shared filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        {/* pizzas earned ↔ activities */}
        <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
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
                className={`min-w-[8rem] text-center px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  isOn ? "bg-black text-white" : "text-gray-500 hover:text-black"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* filters (year/month apply to both views; aggregation is plot-only) */}
        <div className="flex flex-wrap items-center gap-3">
          {view === "pizzas" && (
            <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
              {(["daily", "monthly"] as const).map((mode) => {
                const isOn = aggregation === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => setAggregation(mode)}
                    className={`px-3.5 py-1.5 text-sm font-medium capitalize transition-colors ${
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

          {/* year selector */}
          <select
            value={year}
            onChange={(e) => {
              setYear(e.target.value === "all" ? "all" : Number(e.target.value));
              setShown(PAGE);
            }}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 bg-white hover:border-gray-400 transition-colors"
          >
            <option value="all">All years</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* month selector */}
          <select
            value={month}
            onChange={(e) => {
              setMonth(
                e.target.value === "all" ? "all" : Number(e.target.value),
              );
              setShown(PAGE);
            }}
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
        /* pizza tracker */
        <section className="mb-12">
          {/* what the total actually means, the plot alone only shows a count */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatTile label={`${pizza} earned`} value={pizzas.pizzas.toLocaleString()} />
            <StatTile
              label="Best month"
              value={pizzas.best ? pizzas.best.label : "—"}
              sub={pizzas.best ? `${pizzas.best.pizzas} × ${pizza}` : undefined}
            />
            <StatTile
              label={`${pizza} per month`}
              value={pizzas.perMonth.toFixed(1)}
              sub={`over ${pizzas.months} active ${pizzas.months === 1 ? "month" : "months"}`}
            />
            <StatTile
              label="Calories burned"
              value={`${Math.round(pizzas.calories).toLocaleString()} kcal`}
            />
          </div>

          {/* which sport earned the pizzas */}
          {pizzas.byCategory.length > 0 && (
            <div className="mb-6">
              <div className="flex h-2.5 w-full overflow-hidden rounded-full">
                {pizzas.byCategory.map((c) => (
                  <div
                    key={c.key}
                    style={{ width: `${c.share * 100}%`, background: c.accent }}
                    title={`${c.label} ${(c.share * 100).toFixed(0)}%`}
                  />
                ))}
              </div>
              <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1.5">
                {pizzas.byCategory.map((c) => (
                  <span key={c.key} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: c.accent }}
                      aria-hidden="true"
                    />
                    {c.label}
                    <span className="tabular-nums text-gray-400">
                      {c.pizzas} ({(c.share * 100).toFixed(0)}%)
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <PizzaTracker aggregation={aggregation} year={year} month={month} pizza={pizza} />

          <PizzaMenu
            calories={pizzas.calories}
            selected={pizza}
            onSelect={setPizza}
          />
        </section>
      ) : (
        /* activities list */
        <>
          {/* category tabs */}
          <nav className="flex flex-wrap gap-2 mb-8">
            {CATEGORY_META.map((m) => {
              const isActive = m.key === active;
              return (
                <button
                  key={m.key}
                  onClick={() => { setActive(m.key); setShown(PAGE); }}
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

          {/* active category panel */}
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
                {/* per-category stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-7">
                  <MiniStat label="Sessions" value={stats.count.toString()} />
                  <MiniStat
                    label="Distance"
                    value={
                      stats.distanceKm > 0
                        ? `${stats.distanceKm.toFixed(1)} km`
                        : "-"
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
                        : "-"
                    }
                  />
                </div>

                {/* activity list */}
                <ul className="divide-y divide-gray-100">
                  {list.slice(0, shown).map((a) => (
                    <li
                      key={a.id}
                      className="py-3 flex items-start justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-sm break-words">
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

                {list.length > shown && (
                  <div className="mt-5 flex gap-3">
                    <button
                      onClick={() => setShown((n) => n + PAGE)}
                      className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:border-gray-400 hover:text-black"
                    >
                      Load {Math.min(PAGE, list.length - shown)} more ({list.length - shown} left)
                    </button>
                    <button
                      onClick={() => setShown(list.length)}
                      className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:border-gray-400 hover:text-black"
                    >
                      Load all {list.length}
                    </button>
                  </div>
                )}
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
