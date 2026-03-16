import { countries } from "@/app/data/mundo";

export default function BlogPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold tracking-tight mb-10">Mundo</h1>
      <div className="divide-y divide-gray-100">
        {countries.map((country) => (
              <div className="flex items-baseline justify-between gap-4 mb-1">
                <h2 className="font-semibold group-hover:underline">{country}</h2>
                <span className="text-gray-400 text-sm whitespace-nowrap">{Date()}</span>
              </div>
        ))}
      </div>
    </div>
  );
}
