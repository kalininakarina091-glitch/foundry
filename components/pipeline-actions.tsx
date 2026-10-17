"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function PipelineActions() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  async function run(path: string, body?: object) {
    setPending(true);
    setMessage("");
    try {
      const r = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Ошибка обработки");
      setMessage(
        path.endsWith("normalize")
          ? `Обработано сигналов: ${data.total}. Нормализовано: ${data.normalized}; дубликатов: ${data.duplicates}; исключено: ${data.excluded}.`
          : `Обработано материалов: ${data.processed}. Найдено сигналов: ${data.relevant}; пропущено: ${data.skipped}; ошибок: ${data.errors}.`,
      );
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="my-6">
      <div className="flex flex-wrap gap-3">
        <button
          className="button-primary"
          disabled={pending}
          onClick={() => run("/api/signals/extract-batch", { limit: 3 })}
        >
          Извлечь сигналы из 3 материалов
        </button>
        <button
          className="button-secondary"
          disabled={pending}
          onClick={() => run("/api/signals/normalize")}
        >
          Нормализовать сигналы
        </button>
      </div>
      {pending && <p role="status">Обработка…</p>}
      {message && (
        <pre
          role="status"
          className="mt-4 whitespace-pre-wrap break-all text-xs"
        >
          {message}
        </pre>
      )}
    </section>
  );
}
