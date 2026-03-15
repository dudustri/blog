import data from "@/content/portfolio.json";

export type Project = (typeof data)[0];
export const projects = data;
