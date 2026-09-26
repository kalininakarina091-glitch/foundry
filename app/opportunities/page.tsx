import Link from "next/link";
import { listOpportunities } from "@/lib/opportunities";
import { DemoNotice, EmptyState, PageHeader } from "@/components/product-ui";
import OpportunityCatalog from "@/components/opportunity-catalog";
export const dynamic = "force-dynamic";
export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; q?: string; view?: string }>;
}) {
  const { mode, q, view } = await searchParams;
  const demo = mode === "demo";
  const opportunities = await listOpportunities(demo);
  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Возможности / Discover"
        title="Возможности"
        description="Реальные проблемы рынка. Исследования на основе данных."
      >
        {!demo && (
          <Link href="/opportunities?mode=demo" className="button-secondary">
            Посмотреть демо
          </Link>
        )}
      </PageHeader>
      {demo && <DemoNotice />}
      {opportunities.length ? (
        <OpportunityCatalog
          key={`${q ?? ""}:${view ?? ""}`}
          opportunities={opportunities}
          initialQuery={q}
          initialView={view}
        />
      ) : (
        <EmptyState
          title="Возможности ещё не найдены"
          description="Добавьте данные из источников и исследуйте повторяющиеся проблемы. Здесь появятся возможности из базы проекта."
        >
          <Link href="/sources" className="button-primary">
            К источникам
          </Link>
          <Link href="/patterns" className="button-secondary">
            Исследовать паттерны
          </Link>
        </EmptyState>
      )}
    </div>
  );
}
