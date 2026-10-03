"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface Source {
  id: string;
  name: string;
  type: string;
  url: string | null;
  status: string;
  lastSyncedAt: string | null;
  _count: {
    rawItems: number;
  };
}

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let cancelled = false;
    async function loadSources() {
      try {
        const res = await fetch("/api/source");
        const data = await res.json();
        if (!res.ok || !Array.isArray(data))
          throw new Error("Source load failed");
        if (!cancelled) setSources(data);
      } catch {
        if (cancelled) return;
        setSources([]);
        setMessage(
          "Не удалось загрузить источники. Обновите страницу и проверьте базу проекта.",
        );
      }
      if (!cancelled) setLoading(false);
    }
    void loadSources();
    return () => {
      cancelled = true;
    };
  }, [revision]);

  async function handleSync(id: string) {
    setSyncingId(id);
    setMessage(null);

    try {
      const res = await fetch(`/api/source/${id}/sync`, {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok && data.imported !== undefined) {
        setMessage(
          `✓ Импортировано ${data.imported} новых записей из ${data.source}` +
            (data.skipped > 0 ? ` (${data.skipped} уже существовали)` : ""),
        );
        setRevision((value) => value + 1);
      } else {
        setMessage(data.error || "Ошибка синхронизации. Попробуйте ещё раз.");
      }
    } catch {
      setMessage("Ошибка синхронизации. Попробуйте ещё раз.");
    } finally {
      setSyncingId(null);
    }
  }

  if (loading) {
    return (
      <div className="px-8 py-7">
        <p className="text-neutral-400">Загрузка источников...</p>
      </div>
    );
  }

  return (
    <div className="px-8 py-7">
      <h1 className="text-3xl font-semibold text-white">Источники данных</h1>
      <p className="mt-2 text-neutral-400">
        Легальные каналы сигналов. Система хранит оригинал, извлечение и
        интерпретацию.
      </p>

      <Link className="button-secondary mt-4" href="/signals">
        Материалы и извлечение →
      </Link>
      {message && (
        <div className="mt-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-400">
          {message}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {sources.map((source) => (
          <article key={source.id} className="foundry-card rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-white">{source.name}</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  {source._count.rawItems} записей
                </p>
                <p className="mt-1 break-all text-xs text-neutral-500">
                  {source.url || "URL не задан"}
                </p>
                {source.lastSyncedAt && (
                  <p className="mt-1 text-xs text-neutral-600">
                    Последняя синхронизация:{" "}
                    {new Date(source.lastSyncedAt).toLocaleString("ru-RU")}
                  </p>
                )}
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs ${
                  source.status === "active"
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-yellow-500/15 text-yellow-400"
                }`}
              >
                {source.status === "active"
                  ? "Активен"
                  : source.status === "error"
                    ? "Ошибка"
                    : "Отключён"}
              </span>
            </div>

            <button
              onClick={() => handleSync(source.id)}
              disabled={source.status !== "active" || syncingId === source.id}
              className={`mt-4 w-full px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                source.status === "active"
                  ? "bg-neutral-800 text-white hover:bg-neutral-700"
                  : "bg-neutral-900 text-neutral-600 cursor-not-allowed"
              }`}
            >
              {syncingId === source.id
                ? "Синхронизация..."
                : "Синхронизировать"}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
