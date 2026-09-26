import Link from "next/link";
import { listOpportunities } from "@/lib/opportunities";
import OpportunityCard from "@/components/opportunity-card";
import { PageHeader, EmptyState } from "@/components/product-ui";
export const dynamic = "force-dynamic";
export default async function DashboardPage() {
  const opportunities = await listOpportunities();
  const evidence = new Map(
    opportunities.flatMap((o) => o.evidence).map((e) => [e.signalId, e]),
  );
  const stats = [
    { value: opportunities.length, label: "Возможностей найдено" },
    {
      value: [...evidence.values()].filter((e) => e.strength >= 0.7).length,
      label: "Сильных связанных сигналов",
    },
    {
      value: opportunities.filter((o) => o.status === "new").length,
      label: "Ожидают исследования",
    },
  ];
  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Обзор / Discover"
        title="Что стоит исследовать?"
        description="Возможности из сигналов вашего проекта. Изучите доказательства, прежде чем выбирать, что создавать."
      >
        <Link href="/opportunities" className="button-primary">
          Все возможности →
        </Link>
      </PageHeader>
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="border-l-2 border-border pl-4">
            <p className="text-3xl font-semibold tabular-nums">{s.value}</p>
            <p className="mt-2 text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-lg font-semibold">Последние возможности</h2>
        <p className="text-xs text-muted-foreground">
          Score оценивает привлекательность, а не достоверность
        </p>
      </div>
      {opportunities.length ? (
        <div className="space-y-4">
          {opportunities.slice(0, 5).map((o) => (
            <OpportunityCard key={o.id} opportunity={o} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Пока нет возможностей"
          description="Сначала соберите сигналы из источников. Повторяющиеся проблемы помогут обнаружить возможности — одного сигнала недостаточно."
        >
          <Link href="/sources" className="button-primary">
            Открыть источники
          </Link>
          <Link href="/opportunities?mode=demo" className="button-secondary">
            Посмотреть демо
          </Link>
        </EmptyState>
      )}
      <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-border pt-5 text-xs text-muted-foreground">
        <span>Путь исследования</span>
        <Link href="/sources" className="hover:text-foreground">
          Источники →
        </Link>
        <Link href="/signals" className="hover:text-foreground">
          Сигналы →
        </Link>
        <Link href="/patterns" className="hover:text-foreground">
          Повторяющиеся проблемы →
        </Link>
        <span className="text-foreground">Возможности</span>
      </div>
    </div>
  );
}
