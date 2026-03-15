import data from "@/content/resume.json";

export type Experience = (typeof data.experience)[0];
export type Education = (typeof data.education)[0];

export const { techStack, education, experience, languages, extra } = data;
