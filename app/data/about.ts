import data from "@/content/about.json";
import { dmyTime } from "@/app/data/blog";

export type NowEntry = { date: string; entries: string[] };
export type AboutSection = { title: string; body: string };

export const intro: string = data.intro;
// newest first, the rest becomes the archive
export const now: NowEntry[] = [...data.now].sort((a, b) => dmyTime(b.date) - dmyTime(a.date));
export const sections: AboutSection[] = data.sections;
// hover asides inside the text, [label](#key): a short paragraph or a list of [name, place, one line]
export type Note = string | [string, string, string][];
// json arrays type as string[][], the tuple shape is guaranteed by content/about.json
export const notes = ((data as unknown as { notes?: Record<string, Note> }).notes ?? {}) as Record<string, Note>;
