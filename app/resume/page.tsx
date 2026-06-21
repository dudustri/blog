import ResumeLayout from "@/app/components/ResumeLayout";
import { summary } from "@/app/data/resume";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function ResumePage() {
  return (
    <div className="px-6 py-10">
      {/* Centred content column — the timeline is positioned relative to this.
          select-none + cursor-default makes the page text non-copyable with no
          text cursor; interactive cards/links keep their own pointer cursor. */}
      <div className="max-w-4xl mx-auto select-none cursor-default">
        <h1 className="text-3xl font-bold tracking-tight mb-5">Resume</h1>
        <p className="text-gray-600 leading-relaxed mb-10 text-justify">{summary}</p>

        <ResumeLayout />

        {/* Download CV — closing call to action at the end of the page */}
        <div className="mt-16 pt-8 border-t border-gray-200 flex justify-center">
          <a
            href={`${BASE}/images/suspdog2.jpg`}
            download
            className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: "#3e6b89" }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download CV
          </a>
        </div>
      </div>
    </div>
  );
}
