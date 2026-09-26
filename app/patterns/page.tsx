"use client";

import { useState, useEffect } from "react";

interface Pattern {
  clusterName: string;
  patterns: string[];
  strength: number;
  shouldCreateOpportunity: boolean;
}

const patternLabels: Record<string, string> = {
  repeated_pain: "🔁 Повторяющаяся боль",
  cross_source_confirmation: "✅ Подтверждение из разных источников",
  growing_pain: "📈 Растущая боль",
  market_gap: "🕳️ Пробел на рынке",
  regulatory_trigger: "⚖️ Регуляторный триггер",
  emerging_demand: "💡 Растущий спрос",
};

export default function PatternsPage() {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadPatterns() {
      const res = await fetch("/api/patterns");
      const data = await res.json();
      setPatterns(Array.isArray(data) ? data : []);
      setLoading(false);
    }
    void loadPatterns();
  }, []);

  async function handleGenerate(clusterName: string) {
    setGenerating(clusterName);
    setMessage(null);

    try {
      const res = await fetch("/api/opportunities/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clusterName }),
      });
      const data = await res.json();

      if (data.error) {
        setMessage(`Ошибка: ${data.error}`);
      } else {
        setMessage(
          `✓ Opportunity создана: ${data.title} (score: ${data.score})`,
        );
      }
    } catch {
      setMessage("Ошибка генерации");
    } finally {
      setGenerating(null);
    }
  }

  if (loading) {
    return <div className="px-8 py-7 text-neutral-400">Загрузка...</div>;
  }

  return (
    <div className="px-8 py-7 max-w-4xl">
      <h1 className="text-3xl font-semibold text-white">Паттерны</h1>
      <p className="mt-2 text-neutral-400">
        Система ищет повторяющиеся паттерны, которые могут указывать на
        бизнес-возможности.
      </p>

      {message && (
        <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-emerald-400">
          {message}
        </div>
      )}

      {patterns.length === 0 ? (
        <div className="mt-8 foundry-card rounded-2xl p-12 text-center">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-white font-medium">Паттерны не найдены</p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {patterns.map((pattern, index) => (
            <div key={index} className="foundry-card rounded-2xl p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="font-semibold text-white">
                    {pattern.clusterName}
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {pattern.patterns.map((p) => (
                      <span
                        key={p}
                        className="rounded-full bg-[#171717] px-3 py-1 text-xs text-neutral-400"
                      >
                        {patternLabels[p] || p}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <span
                    className={`text-2xl font-bold ${pattern.strength >= 50 ? "text-emerald-400" : "text-neutral-500"}`}
                  >
                    {pattern.strength}
                  </span>
                  <p className="text-xs text-neutral-500">/ 100</p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                {pattern.shouldCreateOpportunity && (
                  <button
                    onClick={() => handleGenerate(pattern.clusterName)}
                    disabled={generating === pattern.clusterName}
                    className="rounded-xl bg-[#FF6B00] px-5 py-2 text-sm font-medium text-black hover:bg-[#ff7d1f] disabled:opacity-50"
                  >
                    {generating === pattern.clusterName
                      ? "Создание..."
                      : "Создать opportunity →"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
