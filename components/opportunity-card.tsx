import Link from "next/link";

interface OpportunityCardProps {
  id: string;
  title: string;
  score: number;
  summary: string;
  industry?: string;
  recommendation?: string;
}

function getScoreColor(score: number) {
  if (score >= 85) return "text-emerald-400";
  if (score >= 70) return "text-yellow-400";
  return "text-red-400";
}

function getRecommendationBadge(recommendation?: string) {
  if (!recommendation) return null;
  
  const styles = {
    BUILD: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    SKIP: "bg-red-500/15 text-red-400 border-red-500/20",
    "RESEARCH MORE": "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  };

  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        styles[recommendation as keyof typeof styles] || "bg-neutral-800 text-neutral-400 border-neutral-700"
      }`}
    >
      {recommendation}
    </span>
  );
}

export default function OpportunityCard({
  id,
  title,
  score,
  summary,
  industry,
  recommendation,
}: OpportunityCardProps) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 hover:border-neutral-600 transition-all hover:shadow-lg hover:shadow-black/20 group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {industry && (
              <span className="text-xs text-neutral-500 bg-neutral-800 px-2.5 py-0.5 rounded-full">
                {industry}
              </span>
            )}
            {getRecommendationBadge(recommendation)}
          </div>
          <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors">
            {title}
          </h3>
          <p className="mt-2 text-sm text-neutral-400 leading-relaxed">{summary}</p>
        </div>
        <div className="text-right shrink-0">
          <span className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}</span>
          <p className="text-xs text-neutral-600 mt-1">/ 100</p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between pt-4 border-t border-neutral-800">
        <Link
          href={`/opportunities/${id}`}
          className="px-4 py-2 bg-neutral-800 text-white text-sm rounded-lg hover:bg-neutral-700 transition-colors"
        >
          Explore →
        </Link>
        <span className="text-xs text-neutral-600">Click to see full analysis</span>
      </div>
    </div>
  );
}