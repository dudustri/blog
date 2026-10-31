// run with `bun run test`, which pins a time zone west of UTC where the old date bug showed
import { expect, test } from "bun:test";
import {
  type Activity,
  availableYears,
  caloriesFor,
  filterActivities,
  formatIsoDate,
  pizzaSummary,
} from "../app/data/activities";

const run = (date: string, minutes = 60): Activity => ({
  id: date,
  name: "run",
  type: "Run",
  distanceKm: 10,
  movingTimeSec: minutes * 60,
  elevationM: 0,
  date,
});

test("an activity on the 1st stays in its own month and year", () => {
  const list = [run("2026-09-01"), run("2026-01-01")];
  expect(filterActivities(2026, 8, list).map((a) => a.date)).toEqual(["2026-09-01"]);
  expect(filterActivities(2025, "all", list)).toEqual([]);
  expect(availableYears(list)).toEqual([2026]);
});

test("a date shows as the same calendar day", () => {
  expect(formatIsoDate("2026-09-01")).toBe("1 Sept 2026");
});

test("pizzas are counted in the chosen menu item", () => {
  const list = [run("2026-09-01", 120), run("2026-09-15", 60)];
  const total = list.reduce((s, a) => s + caloriesFor(a), 0);
  const unit = 300;
  const summary = pizzaSummary(list, unit);
  expect(summary.calories).toBe(total);
  expect(summary.pizzas).toBe(Math.floor(total / unit));
  expect(summary.best?.label).toBe("Sep 2026");
});
