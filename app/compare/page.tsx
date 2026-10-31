import Link from "next/link";
import { getOpportunity } from "@/lib/opportunities";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { decodeProfile } from "@/lib/personal-profile";
import { matchOpportunity, opportunityAttributes } from "@/lib/personalization";
import { METRICS, recommendationLabel } from "@/lib/labels";
import { decisionLabel } from "@/lib/decisions";
import { opportunityHref, type OpportunityView } from "@/lib/opportunity-types";
import { EmptyState, PageHeader } from "@/components/product-ui";
export const dynamic = "force-dynamic";
const dateFormat = new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium" });
type Cell = { text: string; value?: number | null };
interface Row {
  label: string;
  cells: Cell[];
  /** Higher numeric value is better; the best cell is emphasised. */
  compare?: boolean;
}
export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const ids = [...new Set(((await searchParams).ids || "").split(",").filter(Boolean))].slice(0, 3);
  const items = (await Promise.all(ids.map((id) => getOpportunity(id)))).filter(
    (o): o is OpportunityView => !!o && !o.demo,
  );
  if (items.length < 2)
    return (
      <div className="page-container">
        <EmptyState
          title="Выберите хотя бы две возможности"
          description="В каталоге нажмите «Сравнить» на двух или трёх карточках, затем «Сравнить →» в панели вверху."
        >
          <Link className="button-primary" href="/opportunities?view=all">
            К каталогу
          </Link>
        </EmptyState>
      </div>
    );
  // Match Score is personal and computed for the signed-in user only.
  const user = await currentUser();
  const [profileRow, rows, decisions] = await Promise.all([
    user ? prisma.userProfile.findUnique({ where: { userId: user.id } }) : null,
    prisma.opportunity.findMany({
      where: { id: { in: items.map((o) => o.id) } },
      select: { id: true, matchAttributes: true, industry: true },
    }),
    user
      ? prisma.opportunityDecision.findMany({
          where: { userId: user.id, opportunityId: { in: items.map((o) => o.id) } },
          select: { opportunityId: true, status: true, note: true },
        })
      : [],
  ]);
  const profile = decodeProfile(profileRow);
  const match = (id: string) => {
    const r = rows.find((x) => x.id === id);
    return r ? matchOpportunity(profile, opportunityAttributes(r.matchAttributes, r.industry)) : null;
  };
  const dimension = (o: OpportunityView, id: string): Cell => {
    const d = o.scoreBreakdown?.dimensions.find((x) => x.id === id);
    return d?.value == null ? { text: "нет данных", value: null } : { text: `${d.value}/100`, value: d.value };
  };
  const table: Row[] = [
    { label: "Категория", cells: items.map((o) => ({ text: o.industry || "—" })) },
    {
      label: METRICS.opportunityScore,
      compare: true,
      cells: items.map((o) => ({
        text: `${o.score}/100 · измерено ${o.scoreBreakdown?.coverage ?? 0}%`,
        value: o.score,
      })),
    },
    { label: "· Доказательства", compare: true, cells: items.map((o) => dimension(o, "evidence")) },
    { label: "· Выраженность спроса", compare: true, cells: items.map((o) => dimension(o, "demand")) },
    { label: "· Актуальность", compare: true, cells: items.map((o) => dimension(o, "recency")) },
    { label: "· Готовность платить", compare: true, cells: items.map((o) => dimension(o, "monetization")) },
    {
      label: "Материалы",
      compare: true,
      cells: items.map((o) => ({
        text: `${o.evidence.length} из ${new Set(o.evidence.map((e) => e.sourceId)).size} источников`,
        value: o.evidence.length,
      })),
    },
    {
      label: "Проверка",
      cells: items.map((o) => ({
        text: o.validation
          ? `${recommendationLabel(o.validation.recommendation)} · ${METRICS.validationConfidence.toLowerCase()} ${o.validation.confidence}% · ${dateFormat.format(new Date(o.validation.checkedAt))}`
          : "Не проводилась",
      })),
    },
    {
      label: METRICS.matchScore,
      compare: true,
      cells: items.map((o) => {
        const m = match(o.id);
        return m?.score == null
          ? { text: "нет данных", value: null }
          : { text: `${m.score}/100 · известно ${m.coverage}% факторов`, value: m.score };
      }),
    },
    {
      label: "Моё решение",
      cells: items.map((o) => {
        const d = decisions.find((x) => x.opportunityId === o.id);
        const label = decisionLabel(d?.status);
        return { text: [label, d?.note].filter(Boolean).join(" — ") || "Не принято" };
      }),
    },
    { label: "Целевой клиент", cells: items.map((o) => ({ text: o.customer || "Не установлен" })) },
    { label: "Почему сейчас", cells: items.map((o) => ({ text: o.whyNow || "Нет данных" })) },
    { label: "Конкуренты", cells: items.map((o) => ({ text: o.competition || "В источниках не названы" })) },
  ];
  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Решение"
        title="Сравнение возможностей"
        description="Оценки показаны рядом, но не смешиваются: оценка возможности, уверенность проверки и соответствие вам отвечают на разные вопросы."
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-48 p-3 text-left align-bottom text-muted-foreground" />
              {items.map((o) => (
                <th key={o.id} className="p-3 text-left align-bottom">
                  <Link className="font-semibold hover:underline" href={opportunityHref(o)}>
                    {o.title}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.map((row) => {
              const values = row.cells.map((c) => c.value).filter((v): v is number => typeof v === "number");
              const best = row.compare && values.length > 1 ? Math.max(...values) : null;
              return (
                <tr key={row.label} className="border-t border-border align-top">
                  <th scope="row" className="p-3 text-left font-normal text-muted-foreground">
                    {row.label}
                  </th>
                  {row.cells.map((c, i) => (
                    <td
                      key={i}
                      className={`p-3 ${best !== null && c.value === best ? "font-semibold text-primary" : ""}`}
                    >
                      {c.text}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        «Нет данных» не считается ни нулём, ни совпадением. Выделено лучшее
        значение в строке среди измеренных.
      </p>
    </div>
  );
}
