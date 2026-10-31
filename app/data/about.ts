import data from "@/content/about.json";

export type NowEntry = { date: string; entries: string[] };
export type AboutSection = { title: string; body: string };

export const intro: string = data.intro;
// newest first, the rest becomes the archive
export const now: NowEntry[] = [...data.now].sort((a, b) => {
  const parse = (d: string) => {
    const [day, month, year] = d.split("-");
    return new Date(+year, +month - 1, +day).getTime();
  };
  return parse(b.date) - parse(a.date);
});
export const sections: AboutSection[] = data.sections;
// hover asides inside the text, [label](#key): a short paragraph or a list of [name, place, one line]
export type Note = string | [string, string, string][];
// json arrays type as string[][], the tuple shape is guaranteed by content/about.json
export const notes = ((data as unknown as { notes?: Record<string, Note> }).notes ?? {}) as Record<string, Note>;
