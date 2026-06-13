/**
 * Import a Strava bulk export → content/activities.json
 *
 * Strava's API now requires a paid subscription, so instead we use the free
 * bulk export:
 *   Strava → Settings → My Account → "Download or Delete Your Account" →
 *   Get Started → "Request your archive". Strava emails you a ZIP; unzip it and
 *   point this script at the `activities.csv` inside.
 *
 * Run:
 *   bun run scripts/import-strava-export.ts path/to/activities.csv
 *   # or: bun run import:strava path/to/activities.csv
 *
 * The CSV layout varies by account/locale and even has DUPLICATE column names
 * (e.g. two "Distance" columns — the first in km/mi, the later in metres). This
 * maps columns by name and makes best-effort guesses, printing the columns it
 * picked so you can sanity-check. If a field looks wrong, paste me the header
 * line of your CSV and I'll lock the mappings.
 */

import { readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "content", "activities.json");
const META_OUT = join(__dirname, "..", "content", "activities-meta.json");

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: bun run import:strava <path-to-activities.csv>");
  process.exit(1);
}

// --- minimal CSV parser (handles quotes, escaped "", newlines in fields) -----
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const text = (await readFile(csvPath, "utf8")).replace(/^﻿/, ""); // strip BOM
const rows = parseCSV(text).filter((r) => r.some((c) => c.trim() !== ""));
if (rows.length < 2) {
  console.error("CSV has no data rows.");
  process.exit(1);
}

const header = rows[0].map((h) => h.trim());
const idxAll = (name: string) =>
  header.flatMap((h, i) => (h.toLowerCase() === name.toLowerCase() ? [i] : []));
const first = (name: string) => idxAll(name)[0] ?? -1;
const last = (name: string) => {
  const a = idxAll(name);
  return a.length ? a[a.length - 1] : -1;
};

const iId = first("Activity ID");
const iName = first("Activity Name");
const iType = first("Activity Type");
const iDate = first("Activity Date");
const iMovingTime = last("Moving Time"); // seconds
const iDistance = last("Distance"); // metres (the detailed, later column)
const iElev = last("Elevation Gain"); // metres
const iHr = last("Average Heart Rate"); // bpm

if (iId < 0 || iDate < 0 || iType < 0) {
  console.error(
    "Couldn't find expected columns (Activity ID / Date / Type). Header was:\n",
    header.join(" | "),
  );
  process.exit(1);
}
console.log("Resolved columns:", {
  id: header[iId],
  date: header[iDate],
  name: header[iName],
  type: header[iType],
  movingTime: header[iMovingTime],
  distance: header[iDistance],
  elevation: header[iElev],
  heartrate: header[iHr],
});

const pad = (n: number) => n.toString().padStart(2, "0");
function toISODate(s: string): string {
  const d = new Date(s);
  if (Number.isNaN(+d)) return s.slice(0, 10);
  // Strava export dates are in the athlete's local time → keep the wall date.
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
const num = (s: string | undefined) => {
  const n = parseFloat((s ?? "").replace(/[^0-9.\-]/g, ""));
  return Number.isNaN(n) ? 0 : n;
};
const at = (row: string[], i: number) => (i >= 0 ? row[i] : undefined);

const activities = rows
  .slice(1)
  .map((r) => {
    const distM = num(at(r, iDistance));
    const hr = num(at(r, iHr));
    return {
      id: `s-${(at(r, iId) ?? "").trim()}`,
      name: (at(r, iName) ?? "").trim(),
      // "Trail Run" → "TrailRun", "Weight Training" → "WeightTraining" so it
      // matches the type→category map in app/data/activities.ts.
      type: (at(r, iType) ?? "").trim().replace(/\s+/g, ""),
      distanceKm: Math.round((distM / 1000) * 10) / 10,
      movingTimeSec: Math.round(num(at(r, iMovingTime))),
      elevationM: Math.round(num(at(r, iElev))),
      date: toISODate((at(r, iDate) ?? "").trim()),
      ...(hr > 0 ? { avgHeartrate: Math.round(hr) } : {}),
    };
  })
  .filter((a) => a.id !== "s-" && a.date)
  .sort((a, b) => +new Date(b.date) - +new Date(a.date));

await writeFile(OUT, JSON.stringify(activities, null, 2) + "\n");

// Stamp the generation date so the page can show "last updated".
const generatedAt = new Date().toISOString().slice(0, 10);
await writeFile(META_OUT, JSON.stringify({ generatedAt }, null, 2) + "\n");

console.log(`\nWrote ${activities.length} activities → ${OUT}`);
console.log(`Stamped generatedAt=${generatedAt} → ${META_OUT}`);
if (activities[0]) console.log("Newest:", JSON.stringify(activities[0]));
