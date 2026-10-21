import { detectPatterns } from "@/lib/patterns";
import GenerateFromPattern from "@/components/generate-from-pattern";
import { patternKindLabel } from "@/lib/labels";
export const dynamic = "force-dynamic";
export default async function PatternsPage() {
  const patterns = await detectPatterns();
  return (
    <div className="page-container">
      <h1 className="page-title">Паттерны</h1>
      <p className="my-4 text-muted-foreground">
        Наблюдения из тех же кластеров сигналов. Сходство формулировок —
        эвристика, не доказательство спроса или роста.
      </p>
      {!patterns.length && (
        <p>
          Паттерны не найдены. Нужны минимум два нормализованных сигнала из
          разных материалов.
        </p>
      )}
      <div className="space-y-4">
        {patterns.map((p) => (
          <article key={p.id} className="foundry-card rounded-xl p-5">
            <h2 className="font-semibold">{p.clusterName}</h2>
            <p className="my-3 text-sm">
              {p.signalIds.length} материалов · {p.sourceIds.length} записей
              источников · эвристическая сила {p.strength}/100
            </p>
            <details className="text-xs">
              <summary>Цепочка происхождения</summary>
              <p className="break-all mt-2">
                Кластер {p.clusterId} → паттерн {p.id}
              </p>
              <p className="break-all">Сигналы: {p.signalIds.join(", ")}</p>
              <p className="break-all">
                Материалы: {p.rawItemIds.join(", ")}
              </p>
              <p>Наблюдения: {p.patterns.map(patternKindLabel).join(", ")}</p>
            </details>
            <GenerateFromPattern patternId={p.id} />
          </article>
        ))}
      </div>
    </div>
  );
}
