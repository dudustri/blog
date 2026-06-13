import ResumeLayout from "@/app/components/ResumeLayout";

export default function ResumePage() {
  return (
    <div className="px-6 py-10">
      {/* Centred content column — the timeline is positioned relative to this. */}
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-10">Resume</h1>
        <ResumeLayout />
      </div>
    </div>
  );
}
