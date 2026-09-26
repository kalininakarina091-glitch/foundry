import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ScoreBadge, StatusBadge } from "@/components/product-ui";
import { opportunityHref, type OpportunityView } from "@/lib/opportunity-types";
export default function OpportunityCard({
  opportunity,
}: {
  opportunity: OpportunityView;
}) {
  const sources = new Set(opportunity.evidence.map((e) => e.sourceId)).size;
  return (
    <article className="foundry-card rounded-2xl p-5 transition-colors hover:border-neutral-600 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0 flex-1 basis-64">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {opportunity.industry || "Без категории"}
            </span>
            <span className="text-neutral-600">/</span>
            <StatusBadge status={opportunity.status} />
          </div>
          <h2 className="text-lg font-semibold leading-7">
            <Link
              href={opportunityHref(opportunity)}
              className="hover:text-primary"
            >
              {opportunity.title}
            </Link>
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {opportunity.description || "Описание ещё не сформировано."}
          </p>
        </div>
        <ScoreBadge score={opportunity.score} />
      </div>
      <p className="mt-4 text-sm leading-6">
        <span className="text-muted-foreground">Почему сейчас: </span>
        {opportunity.whyNow || "актуальность ещё предстоит подтвердить."}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">
          {opportunity.evidence.length} доказательств · {sources} источников{" "}
          <span className="mx-1">/</span>{" "}
          {opportunity.demo
            ? "Пример без проверки"
            : "Confidence: нет сохранённого результата"}
        </p>
        <Link
          href={opportunityHref(opportunity)}
          className="inline-flex min-h-10 items-center gap-2 text-sm font-medium"
        >
          Изучить возможность <ArrowUpRight className="size-4 text-primary" />
        </Link>
      </div>
    </article>
  );
}
