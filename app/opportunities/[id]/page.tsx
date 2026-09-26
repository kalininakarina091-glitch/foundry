import Link from "next/link";
import { notFound } from "next/navigation";
import { getOpportunity } from "@/lib/opportunities";
import EvidenceActions from "@/components/evidence-actions";
import {
  DemoNotice,
  EmptyState,
  EvidenceCard,
  ScoreBadge,
  StatusBadge,
} from "@/components/product-ui";
export const dynamic = "force-dynamic";
export default async function OpportunityDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { id } = await params;
  const demo = (await searchParams).mode === "demo";
  const opportunity = await getOpportunity(id, demo);
  if (!opportunity) notFound();
  return (
    <div className="page-container">
      <Link
        href={`/opportunities${demo ? "?mode=demo" : ""}`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Все возможности
      </Link>
      <div className="mt-7">{demo && <DemoNotice />}</div>
      <header className="flex flex-wrap justify-between gap-6 border-b border-border pb-7">
        <div className="min-w-0 flex-1 basis-80">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="eyebrow">
              {opportunity.industry || "Возможность"}
            </span>
            <StatusBadge status={opportunity.status} />
          </div>
          <h1 className="page-title">{opportunity.title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
            {opportunity.description}
          </p>
        </div>
        <ScoreBadge score={opportunity.score} />
      </header>
      <div className="my-6 flex flex-wrap items-center gap-4">
        <Link
          href={`/validation/${encodeURIComponent(id)}${demo ? "?mode=demo" : ""}`}
          className="button-primary"
        >
          Проверить возможность →
        </Link>
        <p className="text-xs leading-5 text-muted-foreground">
          Score — предварительная оценка. Confidence появится в результате
          проверки.
        </p>
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-8">
          <section className="space-y-6">
            <TextSection title="Проблема" value={opportunity.problem} />
            <TextSection title="Целевой клиент" value={opportunity.customer} />
            <TextSection title="Почему сейчас" value={opportunity.whyNow} />
          </section>
          <section id="evidence">
            <div className="mb-4 flex items-center gap-3">
              <h2 className="text-lg font-semibold">
                Доказательства и сигналы
              </h2>
              <span className="badge">{opportunity.evidence.length}</span>
            </div>
            <p className="mb-5 text-sm leading-6 text-muted-foreground">
              Связанные материалы помогают проверить вывод. Сила сигнала не
              равна уверенности в успехе продукта.
            </p>
            {opportunity.evidence.length ? (
              <div className="space-y-3">
                {opportunity.evidence.map((e) => (
                  <EvidenceCard key={e.id} evidence={e} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="Недостаточно данных"
                description={
                  demo
                    ? "У этого демонстрационного примера нет реальных источников."
                    : "К возможности пока не привязаны доказательства. Нельзя сделать обоснованный вывод о спросе."
                }
              />
            )}
            {!demo && (
              <EvidenceActions
                opportunityId={id}
                count={opportunity.evidence.length}
              />
            )}
          </section>
        </div>
        <aside className="space-y-6 border-t border-border pt-6 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0">
          <p className="eyebrow">Контекст решения</p>
          <TextSection title="Рынок" value={opportunity.market} />
          <TextSection title="Конкуренция" value={opportunity.competition} />
          <TextSection title="Монетизация" value={opportunity.monetization} />
          <section>
            <h2 className="mb-2 text-sm font-semibold">Риски</h2>
            {opportunity.risks.length ? (
              <ul className="list-disc space-y-2 pl-4 text-sm leading-6 text-muted-foreground">
                {opportunity.risks.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                Риски ещё не исследованы. Отсутствие данных не означает
                отсутствие рисков.
              </p>
            )}
          </section>
          {opportunity.mvp && (
            <details className="text-sm">
              <summary className="cursor-pointer font-medium">
                Гипотеза MVP
              </summary>
              <p className="mt-3 leading-6 text-muted-foreground">
                {opportunity.mvp}
              </p>
            </details>
          )}
        </aside>
      </div>
    </div>
  );
}
function TextSection({
  title,
  value,
}: {
  title: string;
  value: string | null;
}) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold">{title}</h2>
      <p className="max-w-prose text-sm leading-7 text-muted-foreground">
        {value || "Недостаточно данных. Требуется исследование."}
      </p>
    </section>
  );
}
