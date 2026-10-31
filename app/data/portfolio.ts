import data from "@/content/portfolio.json";
import type { CastMember } from "@/app/components/MatterBackground";

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
  heroCast?: CastMember[]; // sprites in the hero physics layer, squares when unset
};
export const projects = data as Project[];

// project text with [label](url) links reduced to their label, for cards, meta tags and the AI digest
export const plainText = (s: string) => s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
