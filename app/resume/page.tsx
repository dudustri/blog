import type { Metadata } from "next";
import ResumeLayout from "@/app/components/ResumeLayout";
import CompanyLogos from "@/app/components/CompanyLogos";
import CopyDigest from "@/app/components/CopyDigest";
import { careerDigest } from "@/app/data/digest";
import { summary, tagline } from "@/app/data/resume";

export const metadata: Metadata = {
  title: "Resume",
  description: "Career timeline, tech stack, education and experience of Eduardo Sfreddo Trindade, software and energy engineer.",
  alternates: { canonical: "/resume" },
  openGraph: {
    title: "Resume",
    description: "Career timeline, tech stack, education and experience of Eduardo Sfreddo Trindade, software and energy engineer.",
    url: "/resume",
  },
};


export default function ResumePage() {
  return (
    <div className="px-6 py-10">
      {/* centred content column, the timeline is positioned relative to this.
          select-none + cursor-default makes the page text non-copyable with no
          text cursor; interactive cards/links keep their own pointer cursor. */}
      <div className="max-w-4xl mx-auto select-none cursor-default">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-3xl font-bold tracking-tight">Resume</h1>
          <CopyDigest text={careerDigest()} />
        </div>
        <p className="text-lg font-medium leading-snug mb-3">{tagline}</p>
        <p className="text-[15px] text-gray-600 leading-relaxed mb-10 text-justify">{summary}</p>

        <CompanyLogos />

        <ResumeLayout />
      </div>
    </div>
  );
}
