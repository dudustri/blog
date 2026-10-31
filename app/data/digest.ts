import { experience, education, languages, techStackGrouped, summary, tagline, extra, others } from "@/app/data/resume";
import { plainText, projects } from "@/app/data/portfolio";

const SITE = "https://eduardo.dk";

// one markdown digest of the career, used by the copy-for-AI button and by
// /llms.txt. markdown rather than json because models parse it natively and it
// stays readable wherever it is pasted
// compact trims to what fits comfortably in a chat paste, full is for agents
// reading /llms.txt where length is cheap
const RECENT_IN_COMPACT = 3;
const HIGHLIGHTS_IN_COMPACT = 2;

export function careerDigest({ compact = false } = {}): string {
  const roles = experience
    .map((job, i) => {
      const older = compact && i >= RECENT_IN_COMPACT;
      if (older) {
        return `### ${job.title}, ${job.company} (${job.period})${job.impact ? `\n${job.impact}` : ""}`;
      }
      const lines = [`### ${job.title}, ${job.company} (${job.period})`];
      if (job.impact) lines.push(`Impact: ${job.impact}`);
      if (!compact && job.description) lines.push(job.description);
      if (!compact && job.details) lines.push(job.details);
      const picks = compact
        ? (job.highlights ?? []).slice(0, HIGHLIGHTS_IN_COMPACT)
        : (job.highlights ?? []);
      if (picks.length) lines.push(...picks.map((h) => `- ${h}`));
      if (!compact && job.stack?.length) lines.push(`Stack: ${job.stack.join(", ")}`);
      return lines.join("\n");
    })
    .join("\n\n");

  const schooling = education
    .map((e) => {
      const head = `- ${e.degree}, ${e.school} (${e.period})`;
      return compact || !e.description ? head : `${head}\n  ${e.description}`;
    })
    .join("\n");

  const stack = techStackGrouped
    .map((g) => `- ${g.label}: ${g.items.join(", ")}`)
    .join("\n");

  const shipped = projects.filter((p) => !p.wip);
  const work = (compact ? shipped.slice(0, 3) : shipped)
    .map((p) =>
      compact
        ? `- ${p.title}. ${plainText(p.description)}`
        : `- ${p.title}. ${plainText(p.description)} [${p.tech.join(", ")}] ${SITE}/portfolio/${p.slug}`,
    )
    .join("\n");

  const langs = languages
    .map((l: { name: string; level: string }) => `${l.name} (${l.level})`)
    .join(", ");

  // teaching, awards, courses. dropped from the digest entirely before
  const extras = extra
    .map((g) => `### ${g.category}\n${g.items.map((i) => `- ${i.title}`).join("\n")}`)
    .join("\n\n");

  return `# Eduardo Sfreddo Trindade

${tagline}
Copenhagen, Denmark. ${SITE}

## Summary

${summary}

## Experience

${roles}

## Education

${schooling}

## Tech

${stack}

## Selected projects

${work}

## Languages

${langs}
${compact ? "" : `
## Also

${extras}

${others.length ? `### Other\n${others.map((o) => `- ${o}`).join("\n")}` : ""}
`}

## Links

- Site: ${SITE}
- GitHub: https://github.com/dudustri
- LinkedIn: https://linkedin.com/in/eduardo-sfreddo-trindade
`;
}
