"use client";

import { useState } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { mockOpportunities } from "@/lib/mock-data";

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const opportunity = mockOpportunities.find((o) => o.id === id);

  if (!opportunity) {
    notFound();
  }

  return <OpportunityDetail opportunity={opportunity} />;
}

function OpportunityDetail({ opportunity }: { opportunity: (typeof mockOpportunities)[0] }) {
  const [saved, setSaved] = useState(false);

  function getScoreColor(score: number) {
    if (score >= 85) return "text-emerald-400";
    if (score >= 70) return "text-yellow-400";
    return "text-red-400";
  }

  function getRecommendationStyle(recommendation: string) {
    switch (recommendation) {
      case "BUILD":
        return "bg-emerald-500 text-black";
      case "SKIP":
        return "bg-red-500 text-white";
      default:
        return "bg-yellow-500 text-black";
    }
  }

  return (
    <div className="p-8 max-w-5xl">
      {/* Breadcrumb */}
      <Link
        href="/dashboard"
        className="text-neutral-400 hover:text-white transition-colors text-sm"
      >
        ← Back to Opportunities
      </Link>

      {/* Header */}
      <div className="mt-6 flex items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="inline-block px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-full text-xs text-neutral-400">
              {opportunity.industry}
            </span>
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                opportunity.recommendation === "BUILD"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : opportunity.recommendation === "SKIP"
                  ? "bg-red-500/20 text-red-400"
                  : "bg-yellow-500/20 text-yellow-400"
              }`}
            >
              {opportunity.recommendation}
            </span>
          </div>
          <h1 className="mt-3 text-4xl font-bold text-white">{opportunity.title}</h1>
          <p className="mt-2 text-lg text-neutral-400">{opportunity.summary}</p>
        </div>

        {/* Score Card */}
        <div className="shrink-0 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center">
          <p className="text-sm text-neutral-400 mb-2">Opportunity Score</p>
          <span className={`text-5xl font-bold ${getScoreColor(opportunity.score)}`}>
            {opportunity.score}
          </span>
          <p className="text-sm text-neutral-500 mt-1">/ 100</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={() => setSaved(!saved)}
          className={`px-6 py-3 rounded-xl font-medium transition-colors ${
            saved
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "bg-neutral-900 text-white border border-neutral-800 hover:border-neutral-700"
          }`}
        >
          {saved ? "✓ Saved" : "Save"}
        </button>
        <Link
          href={`/validation/${opportunity.id}`}
          className="px-6 py-3 bg-emerald-500 text-black font-medium rounded-xl hover:bg-emerald-400 transition-colors"
        >
          Validate opportunity →
        </Link>
        <button
          disabled
          className="px-6 py-3 bg-neutral-900 text-neutral-600 font-medium rounded-xl cursor-not-allowed"
          title="Coming soon"
        >
          Build this →
        </button>
      </div>

      {/* Main Grid */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Why Now */}
          <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-3">Why now?</h2>
            <p className="text-neutral-400 leading-relaxed">{opportunity.whyNow}</p>
          </section>

          {/* Problem */}
          <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-3">Problem</h2>
            <p className="text-neutral-400 leading-relaxed">{opportunity.problem}</p>
          </section>

          {/* Target Customer */}
          <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-3">Target Customer</h2>
            <p className="text-neutral-400">{opportunity.customer}</p>
          </section>

          {/* Potential MVP */}
          <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-3">Potential MVP</h2>
            <p className="text-neutral-400 leading-relaxed">{opportunity.mvp}</p>
          </section>

          {/* Risks */}
          <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-3">Risks</h2>
            <ul className="space-y-2">
              {opportunity.risks.map((risk: string, index: number) => (
                <li key={index} className="flex items-start gap-2 text-neutral-400">
                  <span className="text-yellow-400 mt-0.5">⚠</span>
                  {risk}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Right Column - Metrics */}
        <div className="space-y-6">
          {/* Market Metrics */}
          <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Market Analysis</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-neutral-500 mb-1">Evidence</p>
                <p className="text-white font-medium">27 signals detected</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500 mb-1">Market</p>
                <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-sm font-medium">
                  Growing
                </span>
              </div>
              <div>
                <p className="text-sm text-neutral-500 mb-1">Competition</p>
                <span className="inline-block px-3 py-1 bg-yellow-500/10 text-yellow-400 rounded-full text-sm font-medium">
                  Medium
                </span>
              </div>
              <div>
                <p className="text-sm text-neutral-500 mb-1">Monetization</p>
                <span className="inline-block px-3 py-1 bg-neutral-800 text-neutral-300 rounded-full text-sm font-medium">
                  Subscription SaaS
                </span>
              </div>
            </div>
          </section>

          {/* Recommendation */}
          <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">AI Recommendation</h2>
            <span
              className={`inline-block px-4 py-2 rounded-xl font-bold ${getRecommendationStyle(
                opportunity.recommendation
              )}`}
            >
              {opportunity.recommendation}
            </span>
            <p className="mt-3 text-sm text-neutral-500">
              {opportunity.recommendation === "BUILD"
                ? "Strong signals detected. Recommended for further validation."
                : opportunity.recommendation === "SKIP"
                ? "High complexity and risks. Not recommended."
                : "Interesting signals, but requires more research."}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}