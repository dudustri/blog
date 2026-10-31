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
