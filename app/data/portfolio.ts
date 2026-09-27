import data from "@/content/portfolio.json";

export type Project = {
  slug: string;
  title: string;
  description: string;
  tech: string[];
  image: string | null;
  content: string;
  wip?: boolean; // write-up still to be done
  heroStyle?: "pixel"; // retro wordmark in the hero, matching the project's own site
  heroImage?: string; // backdrop behind the hero physics layer
};
export const projects = data as Project[];
