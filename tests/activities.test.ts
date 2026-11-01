// run with `bun run test`, which pins a time zone west of UTC where the old date bug showed
import { describe, expect, test } from "bun:test";
import {
  type Activity,
  activities,
  availableYears,
  CATEGORY_META,
  caloriesFor,
  caloriesTimeline,
  categoryOf,
  filterActivities,
  FOOD_MENU,
  foodKcal,
  foodKj,
  foodMenuFor,
  formatDuration,
  formatIsoDate,
  formatPace,
  pizzaMilestones,
  pizzaSummary,
  statsFor,
} from "../app/data/activities";

const act = (date: string, type = "Run", minutes = 60, distanceKm = 10): Activity => ({
  id: `${date}-${type}`,
  name: type,
  type,
  distanceKm,
  movingTimeSec: minutes * 60,
  elevationM: 5,
  date,
});
const accent = (key: string) => CATEGORY_META.find((m) => m.key === key)!.accent;

describe("categories and calories", () => {
  test("strava types map to their bucket, unknown ones to others", () => {
    expect(categoryOf(act("2026-01-01", "TrailRun"))).toBe("running");
    expect(categoryOf(act("2026-01-01", "Swim"))).toBe("swimming");
    expect(categoryOf(act("2026-01-01", "GravelRide"))).toBe("cycling");
    expect(categoryOf(act("2026-01-01", "WeightTraining"))).toBe("gym");
    expect(categoryOf(act("2026-01-01", "Hike"))).toBe("others");
    expect(categoryOf(act("2026-01-01", "Kayaking"))).toBe("others");
  });

  test("calories are MET x 72 kg x hours, rounded", () => {
    expect(caloriesFor(act("2026-01-01", "Run", 60))).toBe(706);
    expect(caloriesFor(act("2026-01-01", "WeightTraining", 60))).toBe(360);
    expect(caloriesFor(act("2026-01-01", "Kayaking", 30))).toBe(252);
    expect(caloriesFor(act("2026-01-01", "Run", 0))).toBe(0);
  });

  test("stats sum every field", () => {
    expect(statsFor([act("2026-01-01"), act("2026-01-02", "Swim", 30, 1.5)])).toEqual({
      count: 2,
      distanceKm: 11.5,
      movingTimeSec: 5400,
      elevationM: 10,
    });
    expect(statsFor([]).count).toBe(0);
  });

  test("the baked data is sorted newest first", () => {
    for (let i = 1; i < activities.length; i++) {
      expect(activities[i - 1].date >= activities[i].date).toBe(true);
    }
  });
});

describe("filters", () => {
  test("an activity on the 1st stays in its own month and year", () => {
    const list = [act("2026-09-01"), act("2026-01-01")];
    expect(filterActivities(2026, 8, list).map((a) => a.date)).toEqual(["2026-09-01"]);
    expect(filterActivities(2025, "all", list)).toEqual([]);
    expect(availableYears(list)).toEqual([2026]);
  });

  test("new year's eve and day land in different years", () => {
    const list = [act("2025-12-31"), act("2026-01-01")];
    expect(filterActivities(2025, 11, list).map((a) => a.date)).toEqual(["2025-12-31"]);
    expect(filterActivities(2026, 0, list).map((a) => a.date)).toEqual(["2026-01-01"]);
    expect(filterActivities("all", 0, list).map((a) => a.date)).toEqual(["2026-01-01"]);
    expect(filterActivities("all", "all", list)).toHaveLength(2);
  });

  test("years are distinct and newest first", () => {
    const list = [act("2024-05-01"), act("2026-02-01"), act("2024-06-01"), act("2025-01-01")];
    expect(availableYears(list)).toEqual([2026, 2025, 2024]);
  });
});

describe("timeline buckets", () => {
  const list = [
    act("2026-10-05"),
    act("2026-09-01"),
    act("2026-09-01", "WeightTraining"),
    act("2026-09-02", "Swim", 30),
  ];

  test("daily buckets are oldest first with a running total", () => {
    const points = caloriesTimeline(list, "daily");
    expect(points.map((p) => p.key)).toEqual(["2026-09-01", "2026-09-02", "2026-10-05"]);
    expect(points.map((p) => p.calories)).toEqual([1066, 299, 706]);
    expect(points.map((p) => p.cumulative)).toEqual([1066, 1365, 2071]);
    expect(points.map((p) => p.isMonthStart)).toEqual([true, false, true]);
    expect(points.map((p) => p.monthShort)).toEqual(["Sep", "Sep", "Oct"]);
  });

  test("a bucket's accents follow its biggest burn", () => {
    const [first] = caloriesTimeline(list, "daily");
    expect(first.accents).toEqual([accent("running"), accent("gym")]);
    expect(first.accent).toBe(accent("running"));
  });

  test("the stack is cumulative, in category order and sums to one", () => {
    const points = caloriesTimeline(list, "daily");
    for (const p of points) {
      const sum = p.stack.reduce((s, x) => s + x.fraction, 0);
      expect(sum).toBeCloseTo(1, 10);
      const order = p.stack.map((s) => CATEGORY_META.findIndex((m) => m.key === s.key));
      expect(order).toEqual([...order].sort((a, b) => a - b));
    }
    expect(points[1].stack.map((s) => s.key)).toEqual(["running", "swimming", "gym"]);
  });

  test("monthly buckets group by YYYY-MM", () => {
    const points = caloriesTimeline(list, "monthly");
    expect(points.map((p) => p.key)).toEqual(["2026-09", "2026-10"]);
    expect(points.map((p) => p.calories)).toEqual([1365, 706]);
  });

  test("milestones mark where each threshold is crossed", () => {
    const points = caloriesTimeline(list, "daily");
    expect(pizzaMilestones(points, 1000)).toEqual([
      { index: 1, pointIndex: 0 },
      { index: 2, pointIndex: 2 },
    ]);
    expect(pizzaMilestones(points, 500).map((m) => m.pointIndex)).toEqual([0, 0, 2, 2]);
    expect(pizzaMilestones([], 500)).toEqual([]);
  });
});

describe("pizzas and the menu", () => {
  test("pizzas are counted in the chosen menu item", () => {
    const list = [act("2026-09-01", "Run", 120), act("2026-09-15", "Run", 60)];
    const total = list.reduce((s, a) => s + caloriesFor(a), 0);
    const summary = pizzaSummary(list, 300);
    expect(summary.calories).toBe(total);
    expect(summary.pizzas).toBe(Math.floor(total / 300));
    expect(summary.best?.label).toBe("Sep 2026");
  });

  test("summary picks the best month and splits by sport", () => {
    const list = [act("2026-08-01", "Run", 30), act("2026-09-01", "Run", 120), act("2026-09-02", "WeightTraining", 60)];
    const s = pizzaSummary(list, 500);
    expect(s.months).toBe(2);
    expect(s.best).toEqual({ label: "Sep 2026", pizzas: 3, calories: 1771 });
    expect(s.perMonth).toBeCloseTo(2124 / 500 / 2, 10);
    expect(s.byCategory.map((c) => [c.key, c.pizzas])).toEqual([["running", 3], ["gym", 0]]);
    expect(s.byCategory.reduce((sum, c) => sum + c.share, 0)).toBeCloseTo(1, 10);
  });

  test("the unit changes the counts but not the calories", () => {
    const list = [act("2026-09-01", "Run", 300)];
    const small = pizzaSummary(list, 100);
    const big = pizzaSummary(list, 1000);
    expect(small.calories).toBe(big.calories);
    expect(small.pizzas).toBe(Math.floor(small.calories / 100));
    expect(big.pizzas).toBe(Math.floor(big.calories / 1000));
  });

  test("an empty list earns nothing", () => {
    expect(pizzaSummary([], 1000)).toEqual({ pizzas: 0, calories: 0, months: 0, perMonth: 0, best: null, byCategory: [] });
  });

  test("menu keeps its order and counts whole items", () => {
    const margherita = FOOD_MENU[0];
    expect(foodKcal(margherita)).toBe(1126);
    expect(foodKj(margherita)).toBe(4711);
    const menu = foodMenuFor(foodKcal(margherita) * 3 + 1);
    expect(menu.map((m) => m.name)).toEqual(FOOD_MENU.map((m) => m.name));
    expect(menu[0].earned).toBe(3);
    for (const item of menu) expect(item.earned).toBe(Math.floor((foodKcal(margherita) * 3 + 1) / item.kcal));
    expect(foodMenuFor(0).every((m) => m.earned === 0)).toBe(true);
  });
});

describe("formatting", () => {
  test("a date shows as the same calendar day", () => {
    expect(formatIsoDate("2026-09-01")).toBe("1 Sept 2026");
    expect(formatIsoDate("2026-01-01")).toBe("1 Jan 2026");
    expect(formatIsoDate("2025-12-31")).toBe("31 Dec 2025");
  });

  test("durations", () => {
    expect(formatDuration(0)).toBe("0m");
    expect(formatDuration(59 * 60)).toBe("59m");
    expect(formatDuration(3600)).toBe("1h 00m");
    expect(formatDuration(5400)).toBe("1h 30m");
    expect(formatDuration(36000 + 300)).toBe("10h 05m");
  });

  test("paces", () => {
    expect(formatPace(10, 3000)).toBe("5:00 /km");
    expect(formatPace(5, 1612)).toBe("5:22 /km");
    expect(formatPace(0, 600)).toBe("-");
  });

  test("rounding never shows 60 seconds or 60 minutes", () => {
    expect(formatPace(1, 359.6)).toBe("6:00 /km");
    expect(formatDuration(7199)).toBe("2h 00m");
    expect(formatDuration(3599)).toBe("1h 00m");
  });
});
