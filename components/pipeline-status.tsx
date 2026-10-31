import Link from "next/link";
import { prisma } from "@/lib/db";
import { AI_MODEL } from "@/lib/ai";
import { EMBEDDING_MODEL } from "@/lib/embeddings";
import { pipelineHints } from "@/lib/pipeline-health";
const dateFormat = new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "medium",
  timeStyle: "short",
});
// Operational overview: counters, models, last activity and next steps.
// Shows configuration as yes/no only, never values of keys.
export default async function PipelineStatus() {
  const clusterable = { duplicateOf: null, normalizedProblem: { not: null } } as const;
  const [activeSources, statuses, signals, normalizedSignals, clusterableSignals, embeddedSignals, lastSync, lastExtract, opportunities] =
    await Promise.all([
      prisma.source.count({ where: { status: "active" } }),
      prisma.rawItem.groupBy({ by: ["extractionStatus"], _count: true }),
      prisma.signal.count(),
      prisma.signal.count({ where: { normalizedProblem: { not: null } } }),
      prisma.signal.count({ where: clusterable }),
      prisma.signal.count({
        where: { ...clusterable, embedding: { contains: `"model":${JSON.stringify(EMBEDDING_MODEL)}` } },
      }),
      prisma.source.aggregate({ _max: { lastSyncedAt: true } }),
      prisma.rawItem.aggregate({ _max: { extractedAt: true } }),
      prisma.opportunity.count({ where: { provenance: { not: null } } }),
    ]);
  const by = (s: string) => statuses.find((x) => x.extractionStatus === s)?._count ?? 0;
  const counts = {
    activeSources,
    pending: by("pending"),
    failed: by("failed"),
    signals,
    normalizedSignals,
    clusterableSignals,
    embeddedSignals,
    aiConfigured: Boolean(process.env.OPENROUTER_API_KEY),
    lastSyncAt: lastSync._max.lastSyncedAt,
    lastExtractAt: lastExtract._max.extractedAt,
  };
  const hints = pipelineHints(counts);
  const when = (d: Date | null) => (d ? dateFormat.format(d) : "ещё не было");
  return (
    <section className="foundry-card my-6 rounded-xl p-5 text-sm" aria-labelledby="pipeline-status">
      <h2 id="pipeline-status" className="text-lg font-semibold">
        Состояние pipeline
      </h2>
      <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Материалы</dt>
          <dd>
            ожидают {counts.pending} · с ошибкой {counts.failed} · без сигнала {by("irrelevant")} · с сигналом {by("extracted")}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Сигналы</dt>
          <dd>
            всего {signals} · в группировке {clusterableSignals} · с эмбеддингами {embeddedSignals}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Возможности</dt>
          <dd>{opportunities}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Последняя синхронизация</dt>
          <dd>{when(counts.lastSyncAt)} · включённых источников {activeSources}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Последнее извлечение</dt>
          <dd>{when(counts.lastExtractAt)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Модели</dt>
          <dd className="break-all">
            {counts.aiConfigured ? AI_MODEL : "AI-ключ не задан"} · эмбеддинги {EMBEDDING_MODEL}
          </dd>
        </div>
      </dl>
      <ul className="mt-4 space-y-1">
        {hints.length ? (
          hints.map((h) => (
            <li key={h.text} className={h.level === "warn" ? "text-amber-300" : "text-muted-foreground"}>
              {h.level === "warn" ? "⚠ " : "• "}
              {h.text}
              {h.href && (
                <>
                  {" "}
                  <Link className="text-primary" href={h.href}>
                    Открыть →
                  </Link>
                </>
              )}
            </li>
          ))
        ) : (
          <li className="text-emerald-300">✓ Всё в порядке: очередь обрабатывается, источники обновляются.</li>
        )}
      </ul>
    </section>
  );
}
