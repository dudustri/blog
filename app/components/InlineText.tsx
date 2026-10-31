import Link from "next/link";

const LINK_CLASS = "font-medium text-[var(--accent)] hover:opacity-80";

export type Note = string | [string, string, string][];

// a word that reveals an aside on hover or tap, same hover-reveal as the info icons
function Aside({ label, note }: { label: string; note: Note }) {
  return (
    <span className="group relative inline-block">
      <span tabIndex={0} className="cursor-default font-medium text-[var(--accent)] outline-none">
        {label}
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-0 top-full z-20 mt-1.5 w-72 rounded-lg border border-gray-200 bg-white p-3 text-left text-xs leading-relaxed text-gray-500 opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {typeof note === "string" ? (
          note
        ) : (
          <span className="flex flex-col gap-1">
            {note.map(([name, place, line]) => (
              <span key={name}>
                <span className="font-semibold text-gray-700">{name}</span>{" "}
                <span className="text-gray-400">({place})</span>, {line}
              </span>
            ))}
            <span className="text-gray-400">etc.</span>
          </span>
        )}
      </span>
    </span>
  );
}

// renders **bold**, [text](https://url or /page) and [text](#note) asides inside a paragraph
export function renderInline(text: string, notes: Record<string, Note> = {}) {
  return text.split(/(\*\*.*?\*\*|\[[^\]]+\]\((?:https?:\/\/|\/|#)[^)\s]*\))/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    const aside = part.match(/^\[([^\]]+)\]\(#([\w-]+)\)$/);
    if (aside && notes[aside[2]]) return <Aside key={i} label={aside[1]} note={notes[aside[2]]} />;
    const link = part.match(/^\[([^\]]+)\]\(((?:https?:\/\/|\/)[^)\s]*)\)$/);
    if (link) {
      const [, label, href] = link;
      // site pages stay in the tab, everything else opens a new one
      return href.startsWith("/") ? (
        <Link key={i} href={href} className={LINK_CLASS}>
          {label}
        </Link>
      ) : (
        <a key={i} href={href} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
          {label}
        </a>
      );
    }
    return part;
  });
}
