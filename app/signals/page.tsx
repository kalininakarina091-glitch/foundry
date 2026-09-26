"use client";

import { useState } from "react";

export default function SignalsPage() {
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{
    processed: number;
    relevant: number;
    skipped: number;
    errors: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleExtract() {
    setProcessing(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/signals/extract-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 3 }),
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch {
      setError("Ошибка извлечения сигналов");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="px-8 py-7 max-w-4xl">
      <h1 className="text-3xl font-semibold text-white">Извлечение сигналов</h1>
      <p className="mt-2 text-neutral-400">
        AI анализирует сырые данные и превращает их в структурированные
        бизнес-сигналы.
      </p>

      <div className="mt-8 bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
        <h2 className="text-white font-semibold mb-4">Обработать RawItems</h2>
        <p className="text-neutral-400 text-sm mb-6">
          Система проанализирует до трёх необработанных материалов и выделит
          бизнес-сигналы.
        </p>

        <button
          onClick={handleExtract}
          disabled={processing}
          className="px-5 py-3 bg-emerald-500 text-black font-medium rounded-xl hover:bg-emerald-400 transition-colors disabled:opacity-50"
        >
          {processing ? "Обработка..." : "Обработать 3"}
        </button>
      </div>

      <button
        onClick={async () => {
          const res = await fetch("/api/signals/normalize", { method: "POST" });
          const data = await res.json();
          alert(
            `Нормализовано: ${data.normalized}, дубликатов: ${data.duplicates}`,
          );
        }}
        className="mt-4 rounded-xl bg-neutral-800 px-5 py-3 font-medium text-white hover:bg-neutral-700"
      >
        Нормализовать сигналы
      </button>

      {result && (
        <div className="mt-6 bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4">Результат</h3>
          <div className="space-y-2 text-sm">
            <p className="text-neutral-300">
              Обработано: <span className="text-white">{result.processed}</span>
            </p>
            <p className="text-emerald-400">
              Релевантных сигналов: {result.relevant}
            </p>
            <p className="text-neutral-400">
              Пропущено (не релевантно): {result.skipped}
            </p>
            {result.errors > 0 && (
              <p className="text-red-400">Ошибок: {result.errors}</p>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}
