import Link from "next/link";
import { listOpportunities } from "@/lib/opportunities";
import { DemoNotice, EmptyState, PageHeader } from "@/components/product-ui";
import OpportunityCatalog from "@/components/opportunity-catalog";
export const dynamic = "force-dynamic";
export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const demo = (await searchParams).mode === "demo";
  const opportunities = await listOpportunities(demo);
  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Возможности / Discover"
        title="От сигнала к возможности"
        description="Изучите проблему, проверьте её происхождение и оцените, достаточно ли доказательств для следующего шага."
      >
        {!demo && (
          <Link href="/opportunities?mode=demo" className="button-secondary">
            Посмотреть демо
          </Link>
        )}
      </PageHeader>
      {demo && <DemoNotice />}
      {opportunities.length ? (
        <OpportunityCatalog opportunities={opportunities} />
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
