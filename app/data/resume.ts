import data from "@/content/resume.json";

// a portfolio project this job contributed to. `slug` must match a project in
// content/portfolio.json so the modal can link straight to /portfolio/<slug>
export type ExperienceProject = { slug: string; title: string };

export type Experience = {
  id: string;
  company: string;
  title: string;
  // one-line outcome shown in bold above the description (originals stay intact)
  impact?: string;
  period: string;
  website?: string;
  // path under /public (no basePath prefix), e.g. "/company_logos/foo.jpg"
  logo?: string;
  description: string;
  // complementary deep-dive shown under the description in the modal, not a
  // paraphrase of it. optional, only curated jobs have it
  details?: string;
  highlights?: string[];
  projects?: ExperienceProject[];
  stack?: string[];
};

export type Education = (typeof data.education)[0];

// an Extra item can carry an optional deep-dive shown in its popup
export type ExtraItem = { title: string; details?: string };
export type ExtraGroup = { category: string; items: ExtraItem[] };

export const experience: Experience[] = data.experience;
export const { summary, tagline, techStack, education, languages } = data;
export const extra = data.extra as ExtraGroup[];
export const others = data.others as string[];

// a tech-stack label can be a coupled item like "C / C++". these helpers treat
// it as any of its slash-separated parts, so selecting the coupled chip still
// matches jobs (and per-job chips) listing only "C" or only "C++"
export function techParts(tech: string): string[] {
  return tech.split(" / ").map((t) => t.trim());
}

export function jobHasTech(stack: string[] | undefined, tech: string): boolean {
  return techParts(tech).some((p) => stack?.includes(p) ?? false);
}

export function chipMatchesSelected(chip: string, selected: string[]): boolean {
  return selected.some((t) => t === chip || techParts(t).includes(chip));
}
