import data from "@/content/portfolio.json";

export type Project = {
  slug: string;
  title: string;
  description: string;
  tech: string[];
  image: string | null;
  content: string;
  wip?: boolean; // write-up still to be done
};
export const projects = data as Project[];
