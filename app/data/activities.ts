import data from "@/content/activities.json";

// Normalised Strava activity baked into content/activities.json. Declared
// explicitly (not inferred from the JSON) so a mix of entries with and without
// avgHeartrate — common in real exports — doesn't break the build.
export type Activity = {
  id: string;
  name: string;
  type: string;
  distanceKm: number;
  movingTimeSec: number;
  elevationM: number;
  date: string; // YYYY-MM-DD
  avgHeartrate?: number;
};

export type Category = "running" | "swimming" | "cycling" | "gym" | "others";

// Strava `type` → our five buckets. Anything unmapped falls back to "others".
const TYPE_TO_CATEGORY: Record<string, Category> = {
  Run: "running",
  TrailRun: "running",
  VirtualRun: "running",
  Swim: "swimming",
  Ride: "cycling",
  VirtualRide: "cycling",
  MountainBikeRide: "cycling",
  GravelRide: "cycling",
  EBikeRide: "cycling",
  WeightTraining: "gym",
  Workout: "gym",
  Crossfit: "gym",
  Yoga: "gym",
  Pilates: "gym",
  Walk: "others",
  Hike: "others",
  Rowing: "others",
  Elliptical: "others",
  StairStepper: "others",
};

export function categoryOf(activity: Activity): Category {
  return TYPE_TO_CATEGORY[activity.type] ?? "others";
}

export type CategoryMeta = {
  key: Category;
  label: string;
  accent: string; // brand-ish accent colour per sport
};

// Order = display order on the page.
export const CATEGORY_META: CategoryMeta[] = [
  { key: "running", label: "Running", accent: "#e0533d" },
  { key: "swimming", label: "Swimming", accent: "#2f8fd6" },
  { key: "cycling", label: "Cycling", accent: "#2fae6a" },
  { key: "gym", label: "Gym", accent: "#9b6fd6" },
  { key: "others", label: "Others", accent: "#facc15" },
];

export type CategoryStats = {
  count: number;
  distanceKm: number;
  movingTimeSec: number;
  elevationM: number;
};

export const activities: Activity[] = (data as Activity[])
  .slice()
  .sort((a, b) => +new Date(b.date) - +new Date(a.date));

export function activitiesByCategory(category: Category): Activity[] {
  return activities.filter((a) => categoryOf(a) === category);
}

export function statsFor(list: Activity[]): CategoryStats {
  return list.reduce<CategoryStats>(
    (acc, a) => ({
      count: acc.count + 1,
      distanceKm: acc.distanceKm + a.distanceKm,
      movingTimeSec: acc.movingTimeSec + a.movingTimeSec,
      elevationM: acc.elevationM + a.elevationM,
    }),
    { count: 0, distanceKm: 0, movingTimeSec: 0, elevationM: 0 },
  );
}

// --- formatting helpers (shared by the page) ---------------------------------

export function formatDuration(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.round((totalSec % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

export function formatPace(distanceKm: number, movingTimeSec: number): string {
  if (distanceKm <= 0) return "—";
  const secPerKm = movingTimeSec / distanceKm;
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${s.toString().padStart(2, "0")} /km`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// --- calories & pizza tracker -------------------------------------------------

// Rough MET (metabolic equivalent) per bucket — good enough for a vanity chart,
// not a nutrition app. calories ≈ MET × bodyWeight(kg) × hours.
const MET_BY_CATEGORY: Record<Category, number> = {
  running: 9.8,
  cycling: 7.5,
  swimming: 8.3,
  others: 7.0,
  gym: 5.0,
};

const BODY_WEIGHT_KG = 72;

/** One whole pizza ≈ this many kcal. Cross it and you've "earned" a pizza. */
export const PIZZA_KCAL = 1000;

/** Estimated calories burned for a single activity. */
export function caloriesFor(activity: Activity): number {
  const met = MET_BY_CATEGORY[categoryOf(activity)];
  return Math.round(met * BODY_WEIGHT_KG * (activity.movingTimeSec / 3600));
}

// --- filtering & aggregation --------------------------------------------------

export type Aggregation = "daily" | "monthly";

export const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Distinct years present in the data, newest first. */
export function availableYears(list: Activity[] = activities): number[] {
  const years = new Set<number>();
  for (const a of list) years.add(new Date(a.date).getFullYear());
  return [...years].sort((a, b) => b - a);
}

/** Filter activities by an optional year and month (0-based). "all" = no filter. */
export function filterActivities(
  year: number | "all",
  month: number | "all",
  list: Activity[] = activities,
): Activity[] {
  return list.filter((a) => {
    const d = new Date(a.date);
    if (year !== "all" && d.getFullYear() !== year) return false;
    if (month !== "all" && d.getMonth() !== month) return false;
    return true;
  });
}

export type TimelinePoint = {
  key: string; // YYYY-MM-DD (daily) or YYYY-MM (monthly)
  monthShort: string; // e.g. "Jun" — used as the per-bar legend
  isMonthStart: boolean; // first bucket of a calendar month (for daily axis labels)
  calories: number; // kcal burned in this bucket
  cumulative: number; // running total up to and including this bucket
  accent: string; // colour of the bucket's dominant category
  accents: string[]; // every category's colour, most calories first (for cycling)
};

/** Accent colour of each category present in the bucket, biggest burn first. */
function bucketAccents(acts: Activity[]): string[] {
  const burn = new Map<Category, number>();
  for (const a of acts) {
    const c = categoryOf(a);
    burn.set(c, (burn.get(c) ?? 0) + caloriesFor(a));
  }
  return [...burn.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([cat]) => CATEGORY_META.find((m) => m.key === cat)!.accent);
}

/**
 * Calories aggregated per bucket (day or month), oldest → newest, with a
 * running cumulative total and a month-short label per bucket.
 */
export function caloriesTimeline(
  list: Activity[] = activities,
  aggregation: Aggregation = "daily",
): TimelinePoint[] {
  const buckets = new Map<string, Activity[]>();
  for (const a of list) {
    const key = aggregation === "monthly" ? a.date.slice(0, 7) : a.date;
    const bucket = buckets.get(key);
    if (bucket) bucket.push(a);
    else buckets.set(key, [a]);
  }

  let cumulative = 0;
  let prevMonth = "";
  return [...buckets.entries()]
    .sort(([a], [b]) => +new Date(a) - +new Date(b))
    .map(([key, acts]) => {
      const calories = acts.reduce((s, a) => s + caloriesFor(a), 0);
      cumulative += calories;
      const month = key.slice(0, 7);
      const isMonthStart = month !== prevMonth;
      prevMonth = month;
      const monthIdx = Number(key.slice(5, 7)) - 1;
      const accents = bucketAccents(acts);
      return {
        key,
        monthShort: MONTH_SHORT[monthIdx] ?? "",
        isMonthStart,
        calories,
        cumulative,
        accent: accents[0],
        accents,
      };
    });
}

export type PizzaMilestone = {
  index: number; // 1-based pizza number
  pointIndex: number; // index into the TimelinePoint[] where this pizza is "earned"
};

/** Bucket index at which each successive PIZZA_KCAL threshold is crossed. */
export function pizzaMilestones(points: TimelinePoint[]): PizzaMilestone[] {
  const out: PizzaMilestone[] = [];
  let next = PIZZA_KCAL;
  points.forEach((p, i) => {
    while (p.cumulative >= next) {
      out.push({ index: out.length + 1, pointIndex: i });
      next += PIZZA_KCAL;
    }
  });
  return out;
}
