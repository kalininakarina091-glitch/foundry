"use client";

import { industries } from "@/lib/mock-data";

export default function FilterTabs({
  active,
  onChange,
}: {
  active: string;
  onChange: (industry: string) => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {industries.map((industry) => (
        <button
          key={industry}
          onClick={() => onChange(industry)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            active === industry
              ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
              : "bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white hover:border-neutral-600"
          }`}
        >
          {industry}
        </button>
      ))}
    </div>
  );
}