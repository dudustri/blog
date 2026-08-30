import MatterBackground from "./MatterBackground";

// CTA banner with the gravity/cursor-repel square physics behind a centered
// title, subtitle and call to action.

export default function MatterBanner({
  title,
  subtitle,
  ctaHref,
  ctaLabel,
}: {
  title: React.ReactNode;
  subtitle?: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
      <MatterBackground />

      {/* Foreground content sits above the squares */}
      <div className="relative z-10 px-6 py-16 md:py-20 text-center pointer-events-none">
        <h2 className="text-2xl md:text-4xl font-bold tracking-tight">{title}</h2>
        {subtitle && (
          <p className="mt-4 text-gray-500 text-[15px] max-w-md mx-auto">{subtitle}</p>
        )}
        {ctaHref && ctaLabel && (
          <div className="mt-8">
            <a
              href={ctaHref}
              className="pointer-events-auto inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-85"
              style={{ backgroundColor: "#3e6b89" }}
            >
              {ctaLabel}
              <span aria-hidden="true">→</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
