import Link from "next/link";
import { AI_MODEL } from "@/lib/ai";
import { EMBEDDING_MODEL } from "@/lib/embeddings";
import { pipelineHints } from "@/lib/pipeline-health";
import { pipelineCounts } from "@/lib/pipeline-counts";
const dateFormat = new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "medium",
  timeStyle: "short",
});
// Operational overview: counters, models, last activity and next steps.
// Shows configuration as yes/no only, never values of keys.
export default async function PipelineStatus() {
  const { counts, byStatus: by, opportunities } = await pipelineCounts();
  const { activeSources, signals, clusterableSignals, embeddedSignals } = counts;
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
