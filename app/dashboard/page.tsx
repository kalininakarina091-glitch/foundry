"use client";

import { useState } from "react";
import Link from "next/link";
import OpportunityCard from "@/components/opportunity-card";
import FilterTabs from "@/components/filter-tabs";
import { mockOpportunities } from "@/lib/mock-data";

export default function DashboardPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = mockOpportunities.filter((o) => {
    const matchesIndustry = activeFilter === "All" || o.industry === activeFilter;
    const matchesSearch =
      searchQuery === "" ||
      o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesIndustry && matchesSearch;
  });

  const highScoreCount = mockOpportunities.filter((o) => o.score >= 85).length;
  const buildCount = mockOpportunities.filter((o) => o.recommendation === "BUILD").length;
  const industriesCount = new Set(mockOpportunities.map((o) => o.industry)).size;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Good morning, Alex</h1>
          <p className="mt-2 text-neutral-400">
            Here's what the market is telling you today.
          </p>
        </div>
        <button className="px-5 py-2.5 bg-emerald-500 text-black font-medium rounded-xl hover:bg-emerald-400 transition-colors">
          + New Scan
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
          <p className="text-sm text-neutral-500">Total Opportunities</p>
          <p className="mt-1 text-3xl font-bold text-white">{mockOpportunities.length}</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
          <p className="text-sm text-neutral-500">High Score (85+)</p>
          <p className="mt-1 text-3xl font-bold text-emerald-400">{highScoreCount}</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
          <p className="text-sm text-neutral-500">Recommended Build</p>
          <p className="mt-1 text-3xl font-bold text-white">{buildCount}</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search opportunities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
        <FilterTabs active={activeFilter} onChange={setActiveFilter} />
      </div>

      {/* Results count */}
      <p className="text-sm text-neutral-500 mb-4">
        Showing {filtered.length} of {mockOpportunities.length} opportunities
        {activeFilter !== "All" && ` in ${activeFilter}`}
      </p>

      {/* Opportunity Cards */}
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((opportunity) => (
            <OpportunityCard
              key={opportunity.id}
              id={opportunity.id}
              title={opportunity.title}
              score={opportunity.score}
              summary={opportunity.summary}
              industry={opportunity.industry}
              recommendation={opportunity.recommendation}
            />
          ))}
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-white font-medium">No opportunities found</p>
          <p className="mt-2 text-neutral-500 text-sm">
            Try changing your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
}