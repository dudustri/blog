import ResumeLayout from "@/app/components/ResumeLayout";
import CompanyLogos from "@/app/components/CompanyLogos";
import { summary, tagline } from "@/app/data/resume";

export default function ResumePage() {
  return (
    <div className="px-6 py-10">
      {/* Centred content column — the timeline is positioned relative to this.
          select-none + cursor-default makes the page text non-copyable with no
          text cursor; interactive cards/links keep their own pointer cursor. */}
      <div className="max-w-4xl mx-auto select-none cursor-default">
        <h1 className="text-3xl font-bold tracking-tight mb-4">Resume</h1>
        <p className="text-lg font-medium leading-snug mb-3">{tagline}</p>
        <p className="text-gray-600 leading-relaxed mb-10 text-justify">{summary}</p>

        <CompanyLogos />

        <ResumeLayout />
      </div>
    </div>
  );
}
