import data from "@/content/resume.json";

// A portfolio project this job contributed to. `slug` must match a project in
// content/portfolio.json so the modal can link straight to /portfolio/<slug>.
export type ExperienceProject = { slug: string; title: string };

export type Experience = {
  id: string;
  company: string;
  title: string;
  period: string;
  website?: string;
  // Path under /public (no basePath prefix), e.g. "/company_logos/foo.jpg".
  logo?: string;
  description: string;
  // Complementary deep-dive shown under the description in the modal (not a
  // paraphrase of it). Optional — only curated jobs have it.
  details?: string;
  highlights?: string[];
  team?: string;
  projects?: ExperienceProject[];
  stack?: string[];
  reviewTodo?: string;
};

export type Education = (typeof data.education)[0];

export const experience: Experience[] = data.experience;
export const { techStack, education, languages, extra } = data;
