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
export const engineeringStack = data.engineeringStack as string[];
export type CompanyLogo = { company: string; logo: string; website?: string };

// one entry per company that has a logo, most recent first
export const companyLogos: CompanyLogo[] = Array.from(
  experience
    .filter((e) => e.logo)
    .reduce((map, e) => {
      if (!map.has(e.company)) {
        map.set(e.company, { company: e.company, logo: e.logo!, website: e.website });
      }
      return map;
    }, new Map<string, CompanyLogo>())
    .values(),
);

// the 28 chips read as one undifferentiated blob, so they are grouped for
// scanning. order here is display order, anything unlisted falls into Other
const TECH_GROUPS: { label: string; items: string[] }[] = [
  { label: "Languages", items: ["C / C++", "C#", "Java", "Python", "Golang", "Rust", "TypeScript", "Bash"] },
  { label: "Databases", items: ["SQL", "NoSQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "ArangoDB", "Elasticsearch"] },
  { label: "Services", items: ["Node", "React", "REST", "GraphQL", "gRPC", "WebRTC", "WebSockets", "SSE", "SignalR", "Webhooks", "WASM"] },
  { label: "Platform", items: ["Docker", "Kubernetes", "Linux", "Nginx", "Git", "GitHub Actions", "Jenkins", "CI/CD", "Make"] },
  { label: "Cloud", items: ["AWS", "GCP", "Azure", "Oracle Cloud"] },
  { label: "Observability", items: ["Grafana", "Prometheus", "Kibana"] },
];

// the engineering half of the stack, same chip and filter mechanism
const ENG_GROUPS: { label: string; items: string[] }[] = [
  { label: "Field", items: ["Modbus", "MQTT", "LoRaWAN", "NB-IoT", "Bluetooth", "ESP32", "PCB design", "Sensors", "Controls"] },
  { label: "Power", items: ["Photovoltaics", "Inverters", "Wind turbines", "Energy metering", "Grid balancing", "FCR-D", "SCADA"] },
  { label: "HVAC", items: ["VRF", "Chilled water", "Heat pumps", "Building automation"] },
  { label: "Modelling", items: ["EnergyPlus", "OpenStudio", "Dialux", "DIVA", "Revit", "AutoCAD"] },
  { label: "Analysis", items: ["Thermal simulation", "Daylighting", "Acoustics", "Ventilation", "Commissioning"] },
  { label: "Standards", items: ["LEED", "ASHRAE 90.1", "ASHRAE 62.1", "ASHRAE 55", "NBR 15575"] },
];

function group(all: string[], defs: { label: string; items: string[] }[]) {
  const known = new Set(defs.flatMap((g) => g.items));
  const groups = defs
    .map((g) => ({ label: g.label, items: g.items.filter((t) => all.includes(t)) }))
    .filter((g) => g.items.length > 0);
  const rest = all.filter((t) => !known.has(t));
  return rest.length ? [...groups, { label: "Other", items: rest }] : groups;
}

export const techStackGrouped = group(techStack as string[], TECH_GROUPS);
export const engineeringStackGrouped = group(engineeringStack, ENG_GROUPS);

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

// a job matches when no tech is selected, or when it uses any selected one
// (union). `jobHasTech` handles coupled labels like "C / C++"
export function jobMatches(job: Experience, activeTechs: string[]): boolean {
  return activeTechs.length === 0 || activeTechs.some((t) => jobHasTech(job.stack, t));
}

export function chipMatchesSelected(chip: string, selected: string[]): boolean {
  return selected.some((t) => t === chip || techParts(t).includes(chip));
}
