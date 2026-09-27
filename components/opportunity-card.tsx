import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  ChartNoAxesColumnIncreasing,
  Database,
  CircleHelp,
} from "lucide-react";
import { StatusBadge } from "@/components/product-ui";
import { ScoreRing } from "@/components/opportunity-workspace";
import { opportunityHref, type OpportunityView } from "@/lib/opportunity-types";
export default function OpportunityCard({
  opportunity,
  saved,
  onToggleSave,
}: {
  opportunity: OpportunityView;
  saved: boolean;
  onToggleSave: () => void;
}) {
  const sources = new Set(opportunity.evidence.map((e) => e.sourceId)).size;
  const palette =
    [...(opportunity.industry || opportunity.id)].reduce(
      (sum, c) => sum + c.charCodeAt(0),
      0,
    ) % 6;
  return (
    <article className={`discovery-card art-${palette}`}>
      <div className="card-cover">
        <div className="cover-sculpture" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <span className="category-chip">
          {opportunity.industry || "Без категории"}
        </span>
        <button
          className="bookmark-button"
          aria-label={`${saved ? "Убрать из избранного" : "В избранное"}: ${opportunity.title}`}
          aria-pressed={saved}
          onClick={onToggleSave}
        >
          <Bookmark size={20} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="discovery-card-body">
        <h2>
          <Link href={opportunityHref(opportunity)}>{opportunity.title}</Link>
        </h2>
        <p className="discovery-description">
          {opportunity.problem ||
            opportunity.description ||
            "Описание ещё не сформировано."}
        </p>
        <div className="card-metrics">
          <ScoreRing score={opportunity.score} />
          <div className="card-metric-details">
            <StatusBadge status={opportunity.status} />
            <div className="card-evidence">
              <ChartNoAxesColumnIncreasing size={23} />
              <span>
                <strong>{opportunity.evidence.length}</strong>
                <small>доказательств</small>
              </span>
              <CircleHelp size={20} />
              <span>
                <strong>—</strong>
                <small>уверенность</small>
              </span>
            </div>
          </div>
        </div>
        <div className="discovery-card-footer">
          <span>
            <Database size={14} />
            {sources} источников
          </span>
          <Link href={opportunityHref(opportunity)} className="button-primary">
            Исследовать <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}
