import Link from "next/link";
import {
  Lightbulb,
  ChartNoAxesColumnIncreasing,
  Search,
  Layers3,
} from "lucide-react";
import { listOpportunities } from "@/lib/opportunities";
import type { OpportunityView } from "@/lib/opportunity-types";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { completeProfile, decodeProfile } from "@/lib/personal-profile";
import { nextActions } from "@/lib/next-actions";
import { pipelineWarningCount } from "@/lib/pipeline-counts";
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
  const user = demo ? null : await currentUser();
  const actions = user ? await actionsFor(user, opportunities) : [];
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
      {!demo && opportunities.some((o) => !o.origin) && (
        <p className="mb-5 text-sm text-amber-200">
          В базе есть старые гипотезы без полной истории происхождения. Их
          названия не подтверждают спрос; исключённые доказательства не
          учитываются в оценке.
        </p>
      )}
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
      {actions.length > 0 && (
        <section className="foundry-card mb-6 rounded-2xl p-5" aria-labelledby="next-actions">
          <h2 id="next-actions" className="text-lg font-semibold">
            Что делать дальше
          </h2>
          <ol className="mt-3 grid gap-3 md:grid-cols-2">
            {actions.map((a) => (
              <li key={a.href}>
                <Link
                  href={a.href}
                  className="block h-full rounded-xl border border-border p-4 hover:border-primary/40"
                >
                  <span className="font-medium">{a.title} →</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{a.detail}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}
      <OpportunityWorkspace opportunities={opportunities} />
      <p className="dashboard-footnote">
        Оценка возможности учитывает доказательства, выраженность спроса,
        актуальность и упоминания трат — только там, где есть данные. Это не
        размер рынка и не вероятность успеха. Уверенность в выводе определяется
        отдельно при проверке.
      </p>
    </div>
  );
}

async function actionsFor(
  user: { id: string; isAdmin: boolean },
  opportunities: OpportunityView[],
) {
  const [profile, decisions, plans, feedback, pipeline] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId: user.id } }),
    prisma.opportunityDecision.findMany({
      where: { userId: user.id, status: { not: null } },
      select: { opportunityId: true, status: true },
    }),
    prisma.opportunityPlan.findMany({
      where: { userId: user.id },
      distinct: ["opportunityId"],
      select: { opportunityId: true },
    }),
    prisma.opportunityFeedback.findMany({
      where: { userId: user.id },
      select: { opportunityId: true },
    }),
    user.isAdmin ? pipelineWarningCount() : null,
  ]);
  return nextActions({
    opportunities: opportunities.map((o) => ({
      id: o.id,
      title: o.title,
      score: o.score,
      validated: Boolean(o.validation),
    })),
    decisions: Object.fromEntries(decisions.map((x) => [x.opportunityId, x.status!])),
    planned: new Set(plans.map((p) => p.opportunityId)),
    dismissed: new Set(feedback.map((f) => f.opportunityId)),
    profileComplete: completeProfile(decodeProfile(profile)),
    adminWarnings: pipeline,
  });
}
