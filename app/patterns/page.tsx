import { detectPatterns } from "@/lib/patterns";
import Link from "next/link";
import GenerateFromPattern, {
  ExtendFromPattern,
} from "@/components/generate-from-pattern";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { findPatternOverlaps } from "@/lib/opportunity-overlap";
import {
  clusterMethodLabel,
  patternKindLabel,
  signalTypeLabel,
} from "@/lib/labels";
import { traceableUrl } from "@/lib/traceability";
import { EmptyState } from "@/components/product-ui";
export const dynamic = "force-dynamic";
export default async function PatternsPage() {
  const isAdmin = (await currentUser())?.isAdmin === true;
  const [patterns, opportunities] = await Promise.all([
    detectPatterns(),
    prisma.opportunity.findMany({
      where: { provenance: { not: null } },
      select: { id: true, title: true, provenance: true },
    }),
  ]);
  // Clusterable signals: normalized, not duplicates (see lib/cluster).
  const signalCount = await prisma.signal.count({
    where: { duplicateOf: null, normalizedProblem: { not: null } },
  });
  const overlapOf = (signalIds: string[]) =>
    findPatternOverlaps(signalIds, opportunities)[0];
  const members = new Map(
    (
      await prisma.signal.findMany({
        where: { id: { in: patterns.flatMap((p) => p.signalIds) } },
        include: { rawItem: { include: { source: true } } },
      })
    ).map((s) => [s.id, s]),
  );
  return (
    <div className="page-container">
      <h1 className="page-title">Паттерны</h1>
      <p className="my-4 text-muted-foreground">
        Наблюдения из тех же кластеров сигналов. Сходство формулировок —
        эвристика, не доказательство спроса или роста.
      </p>
      {!patterns.length && (
        <EmptyState
          title="Паттернов пока нет"
          description={
            signalCount < 2
              ? `Сигналов для группировки: ${signalCount}. Паттерн появляется, когда хотя бы два сигнала из разных материалов описывают одну проблему — извлеките сигналы из новых материалов.`
              : `Сигналов для группировки: ${signalCount}, но среди них нет двух про одну и ту же проблему. Нужно больше материалов: добавьте источники, где люди описывают свои проблемы, или дождитесь автосбора.`
          }
        >
          <Link className="button-primary" href="/signals">
            К сигналам
          </Link>
          <Link className="button-secondary" href="/sources">
            Источники
          </Link>
        </EmptyState>
      )}
      <div className="space-y-4">
        {patterns.map((p) => {
          const overlap = overlapOf(p.signalIds);
          return (
          <article key={p.id} className="foundry-card rounded-xl p-5">
            <h2 className="font-semibold">{p.clusterName}</h2>
            <p className="my-3 text-sm">
              {p.signalIds.length} материалов · {p.sourceIds.length} записей
              источников · эвристическая сила {p.strength}/100 ·{" "}
              {clusterMethodLabel(p.method.replace("-complete-link-v2", ""))}, мин.
              сходство {p.cohesion.toFixed(2)}
            </p>
            <ul className="space-y-3">
              {p.signalIds.map((id) => {
                const s = members.get(id);
                if (!s) return null;
                const url = traceableUrl(s.rawItem.url);
                return (
                  <li key={id} className="border-l-2 border-border pl-3 text-sm">
                    <p className="text-xs text-muted-foreground">
                      {signalTypeLabel(s.type)} · {s.rawItem.source.name}
                    </p>
                    <p className="mt-1">{s.title}</p>
                    {s.description && (
                      <p className="mt-1 text-muted-foreground">«{s.description}»</p>
                    )}
                    {url && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary"
                      >
                        Первоисточник ↗
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
            <details className="mt-3 text-xs">
              <summary>Цепочка происхождения</summary>
              <p className="break-all mt-2">
                Кластер {p.clusterId} → паттерн {p.id}
              </p>
              <p className="break-all">Сигналы: {p.signalIds.join(", ")}</p>
              <p className="break-all">
                Материалы: {p.rawItemIds.join(", ")}
              </p>
              <p>Наблюдения: {p.patterns.map(patternKindLabel).join(", ")}</p>
            </details>
            {overlap ? (
              <div className="mt-4 text-sm">
                <p>
                  Эта проблема уже есть в возможности{" "}
                  <Link
                    className="text-primary"
                    href={`/opportunities/${encodeURIComponent(overlap.opportunityId)}`}
                  >
                    «{overlap.title}»
                  </Link>
                  .
                </p>
                {!isAdmin ? null : overlap.extendable ? (
                  <ExtendFromPattern
                    patternId={p.id}
                    opportunityId={overlap.opportunityId}
                    newSignals={overlap.newSignalIds.length}
                  />
                ) : (
                  <p className="mt-1 text-muted-foreground">
                    {overlap.newSignalIds.length
                      ? "Паттерн пересекается с ней лишь частично; новая гипотеза не создаётся, чтобы не дублировать проблему."
                      : "Новых сигналов нет."}
                  </p>
                )}
              </div>
            ) : (
              isAdmin && <GenerateFromPattern patternId={p.id} />
            )}
          </article>
          );
        })}
      </div>
    </div>
  );
}
