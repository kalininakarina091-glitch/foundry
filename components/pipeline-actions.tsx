"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { failureLabel, MAX_EXTRACTION_ATTEMPTS } from "@/lib/ai-errors";
// Each request handles a few items so it stays within the hosting function
// time limit; a full run is a sequence of short requests.
const BATCH = 3;
const MAX_ROUNDS = 10;
type Counts = Record<string, number>;
interface Step {
  counts: Counts;
  failures: Counts;
  /** False when the queue is empty or the step made no progress. */
  more: boolean;
}
interface Job {
  title: string;
  step: () => Promise<Step>;
  summary: (c: Counts) => string;
}
async function post<T>(path: string, body?: object): Promise<T> {
  const r = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || "Ошибка обработки");
  return data as T;
}
function reasonsText(failures: Counts) {
  const text = Object.entries(failures)
    .map(([reason, count]) => `${failureLabel(reason)} — ${count}`)
    .join("; ");
  return text ? `\nПричины ошибок: ${text}.` : "";
}
async function normalize() {
  const n = await post<{
    total: number;
    normalized: number;
    duplicates: number;
    excluded: number;
    embedded?: number;
    embeddingError?: string;
  }>("/api/signals/normalize");
  return (
    `Нормализовано сигналов: ${n.normalized} из ${n.total}; дубликатов: ${n.duplicates}; исключено: ${n.excluded}.` +
    (n.embedded ? ` Эмбеддингов посчитано: ${n.embedded}.` : "") +
    (n.embeddingError
      ? ` Эмбеддинги не посчитаны (${failureLabel(n.embeddingError)}); группировка по совпадению слов.`
      : "")
  );
}
const extractJob = (retryFailed = false): Job => ({
  title: retryFailed ? "Повтор неудачных" : "Извлечение",
  step: async () => {
    const d = await post<{
      processed: number;
      relevant: number;
      skipped: number;
      errors: number;
      failures?: Counts;
    }>("/api/signals/extract-batch", { limit: BATCH, retryFailed });
    return {
      counts: {
        processed: d.processed,
        relevant: d.relevant,
        skipped: d.skipped,
        errors: d.errors,
      },
      failures: d.failures || {},
      more: d.processed >= BATCH,
    };
  },
  summary: (c) =>
    `Обработано материалов: ${c.processed || 0}. Найдено сигналов: ${c.relevant || 0}; пропущено: ${c.skipped || 0}; ошибок: ${c.errors || 0}.`,
});
const recheckJob: Job = {
  title: "Перепроверка старых сигналов",
  step: async () => {
    const d = await post<{
      processed: number;
      kept: number;
      excluded: number;
      errors: number;
      failures: Counts;
      remaining: number;
    }>("/api/signals/recheck", { limit: BATCH });
    return {
      counts: { processed: d.processed, kept: d.kept, excluded: d.excluded, errors: d.errors, remaining: d.remaining },
      failures: d.failures,
      more: d.remaining > 0 && d.kept + d.excluded > 0,
    };
  },
  summary: (c) =>
    `Перепроверено: ${c.processed || 0}. Остались сигналами: ${c.kept || 0}; исключены (не потребность): ${c.excluded || 0}; ошибок: ${c.errors || 0}.`,
};
const fitJob: Job = {
  title: "Оценка требований возможностей",
  step: async () => {
    const d = await post<{
      processed: number;
      updated: number;
      failures: Counts;
      remaining: number;
    }>("/api/opportunities/fit-missing", { limit: BATCH });
    return {
      counts: { processed: d.processed, updated: d.updated },
      failures: d.failures,
      more: d.remaining > 0 && d.updated > 0,
    };
  },
  summary: (c) =>
    `Возможностей оценено: ${c.updated || 0} из ${c.processed || 0}.`,
};
export default function PipelineActions() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const stop = useRef(false);
  const router = useRouter();
  async function run(job: Job | null, { rounds = MAX_ROUNDS, thenNormalize = true } = {}) {
    setPending(true);
    setDone(false);
    stop.current = false;
    const counts: Counts = {};
    const failures: Counts = {};
    const text = () => (job ? job.summary(counts) + reasonsText(failures) : "");
    let note = "";
    try {
      for (let round = 1; job && round <= rounds; round++) {
        if (stop.current) {
          note = "\nОстановлено по запросу.";
          break;
        }
        setMessage(`${job.title}: шаг ${round} из ${rounds}…\n${text()}`);
        const s = await job.step();
        for (const [k, v] of Object.entries(s.counts))
          counts[k] = k === "remaining" ? v : (counts[k] || 0) + v;
        for (const [k, v] of Object.entries(s.failures))
          failures[k] = (failures[k] || 0) + v;
        router.refresh();
        if (!s.more) break;
        if (round === rounds)
          note = "\nВ очереди могут остаться элементы — запустите ещё раз.";
      }
      if (thenNormalize) {
        setMessage(`${text()}${note}\nНормализация…`);
        note += `\n${await normalize()}`;
        setDone(true);
      }
      setMessage(`${text()}${note}`.trim());
      router.refresh();
    } catch (e) {
      setMessage(`${text()}\nОбработка прервана: ${e instanceof Error ? e.message : "ошибка"}`.trim());
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="my-6">
      <div className="flex flex-wrap gap-3">
        <button className="button-primary" disabled={pending} onClick={() => run(extractJob())}>
          Запустить обработку (до {MAX_ROUNDS * BATCH} материалов)
        </button>
        {pending && (
          <button
            className="button-secondary"
            onClick={() => {
              stop.current = true;
            }}
          >
            Остановить после текущего шага
          </button>
        )}
        <button
          className="button-secondary"
          disabled={pending}
          onClick={() => run(extractJob(), { rounds: 1, thenNormalize: false })}
        >
          Извлечь из {BATCH} материалов
        </button>
        <button
          className="button-secondary"
          disabled={pending}
          onClick={() => run(extractJob(true), { rounds: 1, thenNormalize: false })}
        >
          Повторить неудачные (до {MAX_EXTRACTION_ATTEMPTS} попыток)
        </button>
        <button className="button-secondary" disabled={pending} onClick={() => run(null)}>
          Нормализовать сигналы
        </button>
        <button className="button-secondary" disabled={pending} onClick={() => run(recheckJob)}>
          Перепроверить старые сигналы
        </button>
        <button
          className="button-secondary"
          disabled={pending}
          onClick={() => run(fitJob, { thenNormalize: false })}
        >
          Оценить требования возможностей
        </button>
      </div>
      {pending && !message && <p role="status">Обработка…</p>}
      {message && (
        <pre role="status" className="mt-4 whitespace-pre-wrap break-words text-xs">
          {message}
        </pre>
      )}
      {done && (
        <Link href="/patterns" className="button-secondary mt-3">
          Посмотреть паттерны →
        </Link>
      )}
    </section>
  );
}
