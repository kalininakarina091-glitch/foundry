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

const SOURCE_TYPES = [
  { value: "rss", label: "RSS-лента" },
  { value: "github", label: "GitHub" },
  { value: "hackernews", label: "Hacker News (топ)" },
] as const;
// Feeds where people describe their own problems in the post text.
const PRESETS = [
  { name: "Ask HN", type: "rss", url: "https://hnrss.org/ask" },
  { name: "Reddit r/SaaS", type: "rss", url: "https://www.reddit.com/r/SaaS/.rss" },
  {
    name: "Reddit r/smallbusiness",
    type: "rss",
    url: "https://www.reddit.com/r/smallbusiness/.rss",
  },
  {
    name: "Reddit r/Entrepreneur",
    type: "rss",
    url: "https://www.reddit.com/r/Entrepreneur/.rss",
  },
] as const;
const URL_HINTS: Record<string, string> = {
  rss: "Адрес RSS- или Atom-ленты.",
  github:
    "https://github.com/владелец/репозиторий — открытые issues этого репозитория. Просто https://github.com — свежие issues всего GitHub (в основном баг-репорты).",
  hackernews:
    "Импортирует 15 топ-историй; адрес не влияет на результат. Укажите https://news.ycombinator.com.",
};
function AddSourceForm({ onCreated }: { onCreated: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("rss");
  const [url, setUrl] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/source", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), type, url: url.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Не удалось добавить источник.");
      onCreated(data.name);
      setName("");
      setUrl("");
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось добавить источник.");
    } finally {
      setPending(false);
    }
  }
  if (!open)
    return (
      <button className="button-primary mt-4 ml-3" onClick={() => setOpen(true)}>
        + Добавить источник
      </button>
    );
  return (
    <form onSubmit={submit} className="foundry-card mt-6 max-w-2xl space-y-4 rounded-2xl p-5">
      <h2 className="font-semibold text-white">Новый источник</h2>
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-neutral-500">Шаблоны:</span>
        {PRESETS.map((p) => (
          <button
            key={p.url}
            type="button"
            className="rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-300 hover:border-neutral-500"
            onClick={() => {
              setName(p.name);
              setType(p.type);
              setUrl(p.url);
            }}
          >
            {p.name}
          </button>
        ))}
      </div>
      <label className="block text-sm">
        <span className="text-neutral-400">Название</span>
        <input
          required
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-neutral-700 bg-transparent px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="text-neutral-400">Тип</span>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="mt-1 w-full rounded-lg border border-neutral-700 bg-transparent px-3 py-2"
        >
          {SOURCE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="text-neutral-400">Адрес</span>
        <input
          required
          type="url"
          maxLength={2000}
          placeholder="https://"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="mt-1 w-full rounded-lg border border-neutral-700 bg-transparent px-3 py-2"
        />
        <span className="mt-1 block text-xs text-neutral-500">{URL_HINTS[type]}</span>
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}
      <div className="flex gap-3">
        <button type="submit" className="button-primary" disabled={pending}>
          {pending ? "Добавляем…" : "Добавить"}
        </button>
        <button type="button" className="button-secondary" onClick={() => setOpen(false)}>
          Отмена
        </button>
      </div>
    </form>
  );
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
      <AddSourceForm
        onCreated={(name) => {
          setMessage(`✓ Источник «${name}» добавлен. Запустите синхронизацию.`);
          setRevision((value) => value + 1);
        }}
      />
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
