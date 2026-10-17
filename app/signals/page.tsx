import Link from "next/link";
import { prisma } from "@/lib/db";
import { traceableUrl } from "@/lib/traceability";
import PipelineActions from "@/components/pipeline-actions";
export const dynamic = "force-dynamic";
export default async function SignalsPage() {
  const raws = await prisma.rawItem.findMany({
    include: { source: true, signals: true },
    orderBy: { fetchedAt: "desc" },
    take: 100,
  });
  return (
    <div className="page-container">
      <h1 className="page-title">Материалы и сигналы</h1>
      <p className="my-4 text-muted-foreground">
        Последние 100 материалов. Извлечение использует исходный текст;
        нормализация не объединяет независимые публикации в дубликаты.
      </p>
      <PipelineActions />
      <Link href="/clusters" className="button-secondary">
        Кластеры →
      </Link>
      <div className="mt-6 space-y-4">
        {raws.map((r) => (
          <article key={r.id} className="foundry-card rounded-xl p-5">
            <h2>{r.title}</h2>
            <p className="my-2 text-xs text-muted-foreground">
              {r.source.name} · {r.extractionStatus} · {r.signals.length}{" "}
              сигналов
            </p>
            {traceableUrl(r.url) ? (
              <a
                href={traceableUrl(r.url)!}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary"
              >
                Первоисточник ↗
              </a>
            ) : (
              <p className="text-amber-300 text-sm">
                Нет пригодной публичной ссылки: материал исключён из pipeline.
              </p>
            )}
            <details className="mt-3 text-xs">
              <summary>Происхождение и исходный текст</summary>
              <p className="my-2 break-all">
                Source {r.sourceId} → RawItem {r.id}
              </p>
              <p className="whitespace-pre-wrap">
                {r.content ||
                  "Исходный текст отсутствует; доступен только заголовок."}
              </p>
              {r.signals.map((s) => (
                <div className="mt-4 border-t pt-3" key={s.id}>
                  <p>Signal {s.id}</p>
                  <p>{s.title}</p>
                  <p>Цитата: {s.description}</p>
                  <p>Нормализация: {s.normalizedProblem || "Нет"}</p>
                  <p>Дубликат: {s.duplicateOf || "Нет"}</p>
                </div>
              ))}
            </details>
          </article>
        ))}
      </div>
    </div>
  );
}
