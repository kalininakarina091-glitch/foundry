import Link from "next/link";
import {
  Lightbulb,
  ChartNoAxesColumnIncreasing,
  Search,
  Layers3,
} from "lucide-react";
import { listOpportunities } from "@/lib/opportunities";
import { DemoNotice } from "@/components/product-ui";
import OpportunityWorkspace from "@/components/opportunity-workspace";
export const dynamic = "force-dynamic";
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const demo = (await searchParams).mode === "demo";
  const opportunities = await listOpportunities(demo);
  const evidence = new Map(
    opportunities.flatMap((o) => o.evidence).map((e) => [e.signalId, e]),
  );
  const stats = [
    {
      value: opportunities.length,
      label: "Найдено возможностей",
      icon: Lightbulb,
      tone: "violet",
    },
    {
      value: [...evidence.values()].filter((e) => e.strength >= 0.7).length,
      label: "Сильных сигналов",
      icon: ChartNoAxesColumnIncreasing,
      tone: "violet",
    },
    {
      value: opportunities.filter((o) => o.status === "new").length,
      label: "Ждут исследования",
      icon: Search,
      tone: "rose",
    },
    {
      value: evidence.size,
      label: "Связанных сигналов",
      icon: Layers3,
      tone: "cyan",
    },
  ];
  return (
    <div className="page-container dashboard-page">
      <header className="dashboard-heading">
        <div>
          <p className="eyebrow">Ваш радар возможностей</p>
          <h1>От идеи к открытию</h1>
          <p className="dashboard-subtitle">Вот что обнаружил Foundry</p>
          <p className="text-sm text-muted-foreground">
            Реальные сигналы. Понятные доказательства. Следующий шаг.
          </p>
        </div>
        <Link
          className="button-secondary"
          href={demo ? "/dashboard" : "/dashboard?mode=demo"}
        >
          {demo ? "Данные проекта" : "Посмотреть демо"}
        </Link>
      </header>
      {demo && <DemoNotice />}
      <div className="stats-grid">
        {stats.map(({ value, label, icon: Icon, tone }) => (
          <div className="stat-card" key={label}>
            <span className={`stat-icon ${tone}`}>
              <Icon size={23} strokeWidth={1.6} />
            </span>
            <div>
              <p className="stat-value">{value.toLocaleString("ru-RU")}</p>
              <p className="stat-label">{label}</p>
            </div>
          </div>
        ))}
      </div>
      <OpportunityWorkspace opportunities={opportunities} />
      <p className="dashboard-footnote">
        Opportunity Score — предварительная оценка привлекательности.
        Уверенность в выводе определяется отдельно при проверке.
      </p>
    </div>
  );
}
