import { describe, expect, test } from "bun:test";
import { dmyTime, formatDmyDate, isoDate, posts } from "../app/data/blog";
import { notes, now } from "../app/data/about";
import {
  chipMatchesSelected,
  engineeringStack,
  engineeringStackGrouped,
  type Experience,
  experience,
  jobMatches,
  techStack,
  techStackGrouped,
} from "../app/data/resume";
import { plainText, projects } from "../app/data/portfolio";
import { careerDigest } from "../app/data/digest";

describe("blog dates", () => {
  test("dmyTime is local midnight of that day", () => {
    expect(dmyTime("19-09-2026")).toBe(new Date(2026, 8, 19).getTime());
    expect(dmyTime("01-01-2026")).toBeGreaterThan(dmyTime("31-12-2025"));
  });

  test("isoDate and the long format", () => {
    expect(isoDate("19-09-2026")).toBe("2026-09-19");
    expect(formatDmyDate("19-09-2026")).toBe("19 September 2026");
    expect(formatDmyDate("01-03-2026")).toBe("1 March 2026");
  });

  test("posts are newest first", () => {
    for (let i = 1; i < posts.length; i++) {
      expect(dmyTime(posts[i - 1].date)).toBeGreaterThanOrEqual(dmyTime(posts[i].date));
    }
  });

  test("every post has a unique id built from its date", () => {
    const ids = posts.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of posts) expect(p.id).toMatch(new RegExp(`^${isoDate(p.date)}-[0-9a-f]{4}$`));
  });
});

describe("about", () => {
  test("snapshots are newest first and not empty", () => {
    expect(now.length).toBeGreaterThan(0);
    for (let i = 1; i < now.length; i++) {
      expect(dmyTime(now[i - 1].date)).toBeGreaterThan(dmyTime(now[i].date));
    }
    for (const n of now) expect(n.entries.length).toBeGreaterThan(0);
  });

  test("list notes are name, place, line triples", () => {
    for (const note of Object.values(notes)) {
      if (typeof note === "string") expect(note.length).toBeGreaterThan(0);
      else for (const row of note) expect(row).toHaveLength(3);
    }
  });
});

describe("resume skill matching", () => {
  const job = (stack?: string[]) => ({ id: "x", company: "c", title: "t", period: "p", description: "d", stack }) as Experience;

  test("no selection matches every job", () => {
    expect(jobMatches(job(), [])).toBe(true);
    expect(jobMatches(job(["Rust"]), [])).toBe(true);
  });

  test("a selection matches jobs that use any of it", () => {
    expect(jobMatches(job(["Rust", "Go"]), ["Python", "Rust"])).toBe(true);
    expect(jobMatches(job(["Rust"]), ["Python"])).toBe(false);
    expect(jobMatches(job(), ["Python"])).toBe(false);
  });

  test("a coupled label matches either part", () => {
    expect(jobMatches(job(["C"]), ["C / C++"])).toBe(true);
    expect(jobMatches(job(["C++"]), ["C / C++"])).toBe(true);
    expect(jobMatches(job(["C#"]), ["C / C++"])).toBe(false);
  });

  test("modal chips light up for exact or coupled picks", () => {
    expect(chipMatchesSelected("Rust", ["Rust"])).toBe(true);
    expect(chipMatchesSelected("C", ["C / C++"])).toBe(true);
    expect(chipMatchesSelected("C / C++", ["C / C++"])).toBe(true);
    expect(chipMatchesSelected("C", ["C#"])).toBe(false);
    expect(chipMatchesSelected("Rust", [])).toBe(false);
  });

  test("grouped stacks hold every tech exactly once", () => {
    const flat = techStackGrouped.flatMap((g) => g.items);
    expect([...flat].sort()).toEqual([...(techStack as string[])].sort());
    const eng = engineeringStackGrouped.flatMap((g) => g.items);
    expect([...eng].sort()).toEqual([...engineeringStack].sort());
    for (const g of [...techStackGrouped, ...engineeringStackGrouped]) expect(g.items.length).toBeGreaterThan(0);
  });

  test("every job's projects point at a real portfolio page", () => {
    const slugs = new Set(projects.map((p) => p.slug));
    for (const j of experience) for (const p of j.projects ?? []) expect(slugs.has(p.slug)).toBe(true);
  });
});

describe("portfolio text", () => {
  test("plainText keeps link labels only", () => {
    expect(plainText("live [here](https://x.dk)!")).toBe("live here!");
    expect(plainText("[a](/b) and [c](https://d)")).toBe("a and c");
    expect(plainText("no links [at all]")).toBe("no links [at all]");
  });
});

describe("career digest", () => {
  const full = careerDigest();
  const compact = careerDigest({ compact: true });
  const LINK = /\[[^\]]+\]\([^)]+\)/;

  test("has every key section", () => {
    for (const h of ["# Eduardo Sfreddo Trindade", "## Summary", "## Experience", "## Education", "## Tech", "## Selected projects", "## Languages", "## Links"]) {
      expect(full).toContain(h);
      expect(compact).toContain(h);
    }
    expect(full).toContain("## Also");
    expect(compact).not.toContain("## Also");
  });

  test("lists every role and no markdown links", () => {
    for (const j of experience) expect(full).toContain(`### ${j.title}, ${j.company}`);
    expect(full).not.toMatch(LINK);
    expect(compact).not.toMatch(LINK);
  });

  test("skips unfinished projects and stays shorter when compact", () => {
    for (const p of projects.filter((x) => x.wip)) expect(full).not.toContain(`- ${p.title}.`);
    for (const p of projects.filter((x) => !x.wip)) expect(full).toContain(`/portfolio/${p.slug}`);
    expect(compact.length).toBeLessThan(full.length);
  });
});
