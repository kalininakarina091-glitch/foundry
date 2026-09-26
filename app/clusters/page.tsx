"use client";

import { useState, useEffect } from "react";

interface Cluster {
  name: string;
  problem: string;
  customer: string | null;
  signalCount: number;
  sourceCount: number;
  firstDetected: string;
  latestDetected: string;
  signalTypes: string[];
  industries: string[];
  averageStrength: number;
}

export default function ClustersPage() {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadClusters() {
      const res = await fetch("/api/clusters");
      const data = await res.json();
      setClusters(Array.isArray(data) ? data : []);
      setLoading(false);
    }
    void loadClusters();
  }, []);

  if (loading) {
    return <div className="px-8 py-7 text-neutral-400">Загрузка...</div>;
  }

  return (
    <div className="px-8 py-7 max-w-5xl">
      <h1 className="text-3xl font-semibold text-white">Кластеры сигналов</h1>
      <p className="mt-2 text-neutral-400">
        Система группирует похожие сигналы для обнаружения повторяющихся
        проблем.
      </p>

      {clusters.length === 0 ? (
        <div className="mt-8 foundry-card rounded-2xl p-12 text-center">
          <p className="text-4xl mb-4">📊</p>
          <p className="text-white font-medium">Кластеров пока нет</p>
          <p className="mt-2 text-sm text-neutral-500">
            Нужно минимум 2 похожих сигнала для формирования кластера
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {clusters.map((cluster, index) => (
            <div key={index} className="foundry-card rounded-2xl p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {cluster.problem}
                  </h2>
                  <p className="mt-1 text-sm text-neutral-500">
                    {cluster.customer || "Клиент не определён"}
                  </p>
                </div>
                <span className="text-2xl font-bold text-[#FF6B00]">
                  {cluster.signalCount}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-neutral-500">Источников</p>
                  <p className="text-white font-medium">
                    {cluster.sourceCount}
                  </p>
                </div>
                <div>
                  <p className="text-neutral-500">Типов сигналов</p>
                  <p className="text-white font-medium">
                    {cluster.signalTypes.length}
                  </p>
                </div>
                <div>
                  <p className="text-neutral-500">Первый сигнал</p>
                  <p className="text-white font-medium">
                    {new Date(cluster.firstDetected).toLocaleDateString(
                      "ru-RU",
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-neutral-500">Последний</p>
                  <p className="text-white font-medium">
                    {new Date(cluster.latestDetected).toLocaleDateString(
                      "ru-RU",
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {cluster.industries.map((industry) => (
                  <span
                    key={industry}
                    className="rounded-full bg-[#171717] px-3 py-1 text-xs text-neutral-400"
                  >
                    {industry}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
