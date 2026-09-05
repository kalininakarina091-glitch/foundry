"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { mockOpportunities } from "@/lib/mock-data";
import type { ValidationReport } from "@/lib/ai";

const analysisSteps = [
  "Problem",
  "Customer",
  "Competition",
  "Market",
  "Existing solutions",
  "Pricing",
  "Negative evidence",
];

export default function ValidationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [opportunity, setOpportunity] = useState<(typeof mockOpportunities)[0] | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOpportunity() {
      const { id } = await params;
      const found = mockOpportunities.find((o) => o.id === id);
      setOpportunity(found || null);
    }
    loadOpportunity();
  }, [params]);

  useEffect(() => {
    if (!isValidating) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= analysisSteps.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 600);

    return () => clearInterval(interval);
  }, [isValidating]);

  async function handleValidate() {
    if (!opportunity) return;

    setIsValidating(true);
    setCurrentStep(0);
    setError(null);
    setReport(null);

    try {
      const response = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem: opportunity.problem,
          target_customer: opportunity.customer,
          signals: ["Growing regulatory pressure", "Lack of SMB solutions"],
          evidence: ["27 Reddit posts", "Rising search trends"],
          competition: "Medium",
          market: "Growing",
        }),
      });

      if (!response.ok) {
        throw new Error("Validation failed");
      }

      const data = await response.json();
      setReport(data);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsValidating(false);
    }
  }

  if (!opportunity) {
    return (
      <div className="p-8">
        <p className="text-neutral-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl">
      <Link
        href={`/opportunities/${opportunity.id}`}
        className="text-neutral-400 hover:text-white transition-colors text-sm"
      >
        ← Back to Opportunity
      </Link>

      <div className="mt-4">
        <h1 className="text-3xl font-bold text-white">{opportunity.title}</h1>
        <p className="mt-2 text-neutral-400">Deep validation with honest assessment</p>
      </div>

      {/* Validation Button */}
      {!report && !isValidating && (
        <div className="mt-8 bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center">
          <p className="text-4xl mb-4">🔬</p>
          <h2 className="text-xl font-semibold text-white mb-2">
            Ready to validate this opportunity?
          </h2>
          <p className="text-neutral-400 mb-6 max-w-md mx-auto">
            Our AI will analyze the problem, market, competition, and evidence to give you an honest verdict.
          </p>
          <button
            onClick={handleValidate}
            className="px-8 py-3 bg-emerald-500 text-black font-semibold rounded-xl hover:bg-emerald-400 transition-colors"
          >
            Validate Opportunity →
          </button>
        </div>
      )}

      {/* Validation Progress */}
      {isValidating && (
        <div className="mt-8 bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
          <p className="text-white font-medium mb-6">Validating...</p>
          <div className="space-y-3">
            {analysisSteps.map((step, index) => (
              <div key={step} className="flex items-center gap-3">
                {index < currentStep ? (
                  <span className="text-emerald-400">✓</span>
                ) : index === currentStep ? (
                  <span className="animate-spin text-emerald-400">◌</span>
                ) : (
                  <span className="text-neutral-700">○</span>
                )}
                <span
                  className={
                    index < currentStep
                      ? "text-white"
                      : index === currentStep
                      ? "text-emerald-400"
                      : "text-neutral-600"
                  }
                >
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-8 bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
          <p className="text-red-400">{error}</p>
          <button
            onClick={handleValidate}
            className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-400 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Validation Report */}
      {report && !isValidating && (
        <div className="mt-8 space-y-6">
          {/* Verdict Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
            <p className="text-sm text-neutral-500 mb-2">Verdict</p>
            <div className="flex items-center gap-4">
              <span className="text-4xl">
                {report.verdict === "promising" ? "🟢" : report.verdict === "uncertain" ? "🟡" : "🔴"}
              </span>
              <h2 className="text-3xl font-bold text-white capitalize">
                {report.verdict.replace("_", " ")}
              </h2>
            </div>

            <div className="mt-6 flex items-center gap-4">
              <p className="text-sm text-neutral-500">Confidence</p>
              <div className="flex-1 max-w-xs">
                <div className="h-2 bg-neutral-800 rounded-full">
                  <div
                    className="h-2 bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${report.confidence}%` }}
                  />
                </div>
              </div>
              <span className="text-white font-bold">{report.confidence}%</span>
            </div>
          </div>

          {/* Positive Evidence */}
          <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-emerald-400 mb-4">
              ✅ Positive Evidence
            </h3>
            <ul className="space-y-3">
              {report.positive_evidence.map((item, index) => (
                <li key={index} className="flex items-start gap-3 text-neutral-300">
                  <span className="text-emerald-400 mt-0.5">+</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* Negative Evidence */}
          <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-red-400 mb-4">
              ❌ Negative Evidence
            </h3>
            <ul className="space-y-3">
              {report.negative_evidence.map((item, index) => (
                <li key={index} className="flex items-start gap-3 text-neutral-300">
                  <span className="text-red-400 mt-0.5">−</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* Why NOT this idea */}
          <section className="bg-neutral-900 border border-yellow-500/20 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-yellow-400 mb-3">
              ⚠️ Why NOT this idea?
            </h3>
            <p className="text-neutral-300 leading-relaxed">{report.why_not}</p>
          </section>

          {/* Biggest Risk */}
          <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-3">🎯 Biggest Risk</h3>
            <p className="text-neutral-300">{report.biggest_risk}</p>
          </section>

          {/* Recommendation */}
          <section className="bg-neutral-900 border border-emerald-500/30 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-3">📋 Recommendation</h3>
            <p className="text-neutral-300 leading-relaxed">{report.recommendation}</p>
          </section>
        </div>
      )}
    </div>
  );
}