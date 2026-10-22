"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { failureLabel, MAX_EXTRACTION_ATTEMPTS } from "@/lib/ai-errors";
// Each request extracts a few materials so it stays within the hosting
// function time limit; a full run is a sequence of short requests.
const BATCH = 3;
const MAX_ROUNDS = 10;
interface BatchResult {
  processed: number;
  relevant: number;
  skipped: number;
  errors: number;
  failures?: Record<string, number>;
}
async function post<T>(path: string, body?: object): Promise<T> {
  const r = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || "Ошибка обработки");
  return data as T;
}
function reasonsText(failures: Record<string, number>) {
  const text = Object.entries(failures)
    .map(([reason, count]) => `${failureLabel(reason)} — ${count}`)
    .join("; ");
  return text ? `\nПричины ошибок: ${text}.` : "";
}
export default function PipelineActions() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const stop = useRef(false);
  const router = useRouter();
  async function run(path: string, body?: object) {
    setPending(true);
    setMessage("");
    setDone(false);
    try {
      if (path.endsWith("normalize")) {
        const data = await post<{
          total: number;
          normalized: number;
          duplicates: number;
          excluded: number;
        }>(path);
        setMessage(
          `Обработано сигналов: ${data.total}. Нормализовано: ${data.normalized}; дубликатов: ${data.duplicates}; исключено: ${data.excluded}.`,
        );
      } else {
        const data = await post<BatchResult>(path, body);
        setMessage(
          data.processed === 0
            ? "Нет материалов для обработки."
            : `Обработано материалов: ${data.processed}. Найдено сигналов: ${data.relevant}; пропущено: ${data.skipped}; ошибок: ${data.errors}.${reasonsText(data.failures || {})}`,
        );
      }
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setPending(false);
    }
  }
  async function runAll() {
    setPending(true);
    setDone(false);
    stop.current = false;
    const total = { processed: 0, relevant: 0, skipped: 0, errors: 0 };
    const failures: Record<string, number> = {};
    const summary = () =>
      `Обработано материалов: ${total.processed}. Найдено сигналов: ${total.relevant}; пропущено: ${total.skipped}; ошибок: ${total.errors}.${reasonsText(failures)}`;
    let stopped = "";
    try {
      for (let round = 1; round <= MAX_ROUNDS; round++) {
        if (stop.current) {
          stopped = "\nОстановлено по запросу.";
          break;
        }
        setMessage(`Извлечение: шаг ${round} из ${MAX_ROUNDS}…\n${summary()}`);
        const data = await post<BatchResult>("/api/signals/extract-batch", {
          limit: BATCH,
        });
        total.processed += data.processed;
        total.relevant += data.relevant;
        total.skipped += data.skipped;
        total.errors += data.errors;
        for (const [reason, count] of Object.entries(data.failures || {}))
          failures[reason] = (failures[reason] || 0) + count;
        router.refresh();
        if (data.processed < BATCH) break;
      }
      setMessage(`Нормализация…\n${summary()}${stopped}`);
      const norm = await post<{ normalized: number; duplicates: number }>(
        "/api/signals/normalize",
      );
      setMessage(
        `${summary()}${stopped}\nНормализовано сигналов: ${norm.normalized}; дубликатов: ${norm.duplicates}.` +
          (total.processed === MAX_ROUNDS * BATCH
            ? "\nВ очереди могут остаться материалы — запустите обработку ещё раз."
            : ""),
      );
      setDone(true);
      router.refresh();
    } catch (e) {
      setMessage(
        `${summary()}\nОбработка прервана: ${e instanceof Error ? e.message : "ошибка"}`,
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="my-6">
      <div className="flex flex-wrap gap-3">
        <button className="button-primary" disabled={pending} onClick={runAll}>
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
          onClick={() => run("/api/signals/extract-batch", { limit: BATCH })}
        >
          Извлечь из {BATCH} материалов
        </button>
        <button
          className="button-secondary"
          disabled={pending}
          onClick={() =>
            run("/api/signals/extract-batch", {
              limit: BATCH,
              retryFailed: true,
            })
          }
        >
          Повторить неудачные (до {MAX_EXTRACTION_ATTEMPTS} попыток)
        </button>
        <button
          className="button-secondary"
          disabled={pending}
          onClick={() => run("/api/signals/normalize")}
        >
          Нормализовать сигналы
        </button>
      </div>
      {pending && !message && <p role="status">Обработка…</p>}
      {message && (
        <pre
          role="status"
          className="mt-4 whitespace-pre-wrap break-words text-xs"
        >
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
