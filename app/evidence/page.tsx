"use client";

import { useState, useEffect } from "react";

interface EvidenceItem {
  id: string;
  opportunityId: string;
  claim: string;
  evidenceType: string;
  strength: number;
  sourceUrl: string | null;
  signal: {
    type: string;
    title: string | null;
    pain: string | null;
    rawItem: {
      title: string | null;
      url: string | null;
      source: {
        name: string;
        type: string;
      };
    };
  };
}

export default function EvidencePage() {
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvidence() {
      const res = await fetch("/api/evidence?opportunityId=all");
      const data = await res.json();
      setEvidence(Array.isArray(data) ? data : []);
      setLoading(false);
    }
    void loadEvidence();
  }, []);

  if (loading) {
    return (
      <div className="px-8 py-7">
        <p className="text-neutral-400">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="px-8 py-7 max-w-4xl">
      <h1 className="text-3xl font-semibold text-white">Доказательства</h1>
      <p className="mt-2 text-neutral-400">
        Каждое доказательство имеет источник и происхождение.
      </p>

      {evidence.length === 0 ? (
        <div className="mt-8 bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-white font-medium">Нет доказательств</p>
          <p className="mt-2 text-neutral-500 text-sm">
            Сначала привяжите сигналы к opportunity
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {evidence.map((item) => (
            <div
              key={item.id}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.evidenceType === "positive"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : item.evidenceType === "negative"
                          ? "bg-red-500/15 text-red-400"
                          : "bg-neutral-800 text-neutral-400"
                    }`}
                  >
                    {item.evidenceType === "positive"
                      ? "Положительное"
                      : item.evidenceType === "negative"
                        ? "Отрицательное"
                        : "Нейтральное"}
                  </span>
                  <p className="mt-2 text-white font-medium">{item.claim}</p>
                </div>
                <span className="text-sm text-neutral-500">
                  Сила: {Math.round(item.strength * 100)}%
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-neutral-800 space-y-2 text-sm">
                <p className="text-neutral-400">
                  <span className="text-neutral-600">Источник:</span>{" "}
                  {item.signal.rawItem.source.name}
                </p>
                <p className="text-neutral-400">
                  <span className="text-neutral-600">Тип сигнала:</span>{" "}
                  {item.signal.type}
                </p>
                {item.signal.rawItem.title && (
                  <p className="text-neutral-500">
                    <span className="text-neutral-600">Сырые данные:</span>{" "}
                    {item.signal.rawItem.title}
                  </p>
                )}
                {item.sourceUrl && (
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:underline"
                  >
                    View source →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
