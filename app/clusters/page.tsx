import Link from "next/link";
import { clusterSignals } from "@/lib/cluster";
import { clusterMethodLabel } from "@/lib/labels";
export const dynamic = "force-dynamic";
export default async function ClustersPage() {
  const clusters = await clusterSignals();
  return (
    <div className="page-container">
      <h1 className="page-title">Кластеры сигналов</h1>
      <p className="my-4 text-muted-foreground">
        Сигналы объединяются, если каждая пара в кластере похожа по смыслу
        (эмбеддинги английских ключей группировки; порог откалиброван для
        каждой модели эмбеддингов)
        или, если эмбеддингов нет, по совпадению слов. Используются только
        нормализованные сигналы с публичными ссылками; каждый кластер сохраняет
        точные ID участников.
      </p>
      <Link className="button-secondary" href="/patterns">
        Паттерны →
      </Link>
      <div className="mt-5 space-y-4">
        {!clusters.length && <p>Нет кластеров из независимых материалов.</p>}
        {clusters.map((c) => (
          <article key={c.id} className="foundry-card rounded-xl p-5">
            <h2>{c.name}</h2>
            <p className="my-3 text-sm">
              {c.signalCount} материалов · {c.sourceCount} записей источников ·{" "}
              {clusterMethodLabel(c.method)}, мин. сходство {c.cohesion.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">
              Даты публикаций:{" "}
              {c.firstDetected?.toISOString().slice(0, 10) || "неизвестно"} —{" "}
              {c.latestDetected?.toISOString().slice(0, 10) || "неизвестно"}
            </p>
            <details className="mt-3 text-xs">
              <summary>Происхождение</summary>
              <p className="break-all">{c.id}</p>
              <p className="break-all">Сигналы: {c.signalIds.join(", ")}</p>
              <p className="break-all">
                Материалы: {c.rawItemIds.join(", ")}
              </p>
              <p className="break-all">
                Источники: {c.sourceIds.join(", ")}
              </p>
            </details>
          </article>
        ))}
      </div>
    </div>
  );
}
