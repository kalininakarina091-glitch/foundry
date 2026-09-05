"use client";

import { useState } from "react";
import OpportunityCard from "@/components/opportunity-card";
import FilterTabs from "@/components/filter-tabs";
import { mockOpportunities } from "@/lib/mock-data";

export default function OpportunitiesPage() {
  const [activeFilter, setActiveFilter] = useState("All");

  const filtered = activeFilter === "All"
    ? mockOpportunities
    : mockOpportunities.filter((o) => o.industry === activeFilter);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">All Opportunities</h1>
        <p className="mt-1 text-neutral-400">
          Browse and filter all discovered opportunities
        </p>
      </div>

      <div className="mb-6">
        <FilterTabs active={activeFilter} onChange={setActiveFilter} />
      </div>

      <div className="space-y-4">
        {filtered.map((opportunity) => (
          <OpportunityCard
            key={opportunity.id}
            id={opportunity.id}
            title={opportunity.title}
            score={opportunity.score}
            summary={opportunity.summary}
          />
        ))}
      </div>
    </div>
  );
}
