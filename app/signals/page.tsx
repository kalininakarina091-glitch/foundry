import Link from "next/link";
import { prisma } from "@/lib/db";
import { traceableUrl } from "@/lib/traceability";
import PipelineActions from "@/components/pipeline-actions";
import { sourceDocument } from "@/lib/source-text";
import { failureLabel, MAX_EXTRACTION_ATTEMPTS } from "@/lib/ai-errors";
import { extractionAttempts, readMetadata } from "@/lib/extraction";
import { extractionStatusLabel, signalTypeLabel } from "@/lib/labels";
export const dynamic = "force-dynamic";
function failureNote(value: string | null) {
  const metadata = readMetadata(value);
  const extraction = metadata.extraction as { reason?: unknown } | undefined;
  const attempts = extractionAttempts(metadata);
  return `Ошибка извлечения: ${failureLabel(extraction?.reason)}. Попыток: ${attempts} из ${MAX_EXTRACTION_ATTEMPTS}.`;
}
const STATUS_ORDER = [
  "extracted",
  "pending",
  "failed",
  "irrelevant",
  "processing",
  "excluded",
];
const dateFormat = new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "medium",
  timeStyle: "short",
});
export default async function SignalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const requested = (await searchParams).status;
  const status =
    requested && STATUS_ORDER.includes(requested) ? requested : undefined;
  const [raws, counts, signals] = await Promise.all([
    prisma.rawItem.findMany({
      where: status ? { extractionStatus: status } : {},
      include: { source: true, signals: true },
      orderBy: { fetchedAt: "desc" },
      take: 100,
    }),
    prisma.rawItem.groupBy({ by: ["extractionStatus"], _count: true }),
    prisma.signal.findMany({
      include: { rawItem: { include: { source: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);
  const countOf = (s: string) =>
    counts.find((c) => c.extractionStatus === s)?._count ?? 0;
  const total = counts.reduce((sum, c) => sum + c._count, 0);
  return (
    <div className="page-container">
      <h1 className="page-title">Материалы и сигналы</h1>
      <p className="my-4 text-muted-foreground">
        Извлечение использует исходный текст; нормализация не объединяет
        независимые публикации в дубликаты.
      </p>
      <PipelineActions />
      <Link href="/clusters" className="button-secondary">
        Кластеры →
      </Link>
      <section className="mt-8">
        <h2 className="text-lg font-semibold">
          Найденные сигналы{" "}
          <span className="text-sm font-normal text-muted-foreground">
            последние {signals.length}
          </span>
        </h2>
        {!signals.length && (
          <p className="mt-3 text-sm text-muted-foreground">
            Сигналов пока нет. Запустите извлечение для материалов.
          </p>
        )}
        <div className="mt-4 space-y-3">
          {signals.map((s) => {
            const url = traceableUrl(s.rawItem.url);
            return (
              <article key={s.id} className="foundry-card rounded-xl p-4">
                <p className="text-xs text-muted-foreground">
                  {signalTypeLabel(s.type)} · {s.rawItem.source.name} ·{" "}
                  {dateFormat.format(s.createdAt)}
                  {s.duplicateOf ? " · дубликат" : ""}
                </p>
                <h3 className="mt-2 font-medium">{s.title}</h3>
                {s.customer && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Кто: {s.customer}
                  </p>
                )}
                {s.description && (
                  <blockquote className="mt-2 border-l-2 border-border pl-3 text-sm text-muted-foreground">
                    «{s.description}»
                  </blockquote>
                )}
                {url && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm text-primary"
                  >
                    Первоисточник ↗
                  </a>
                )}
              </article>
            );
          })}
        </div>
      </section>
      <h2 className="mt-10 text-lg font-semibold">Материалы</h2>
      <nav aria-label="Фильтр по статусу" className="mt-3 flex flex-wrap gap-2 text-sm">
        <Link
          href="/signals"
          aria-current={!status ? "page" : undefined}
          className={`rounded-full border px-3 py-1 ${!status ? "border-primary text-foreground" : "border-border text-muted-foreground"}`}
        >
          Все · {total}
        </Link>
        {STATUS_ORDER.filter((s) => countOf(s) > 0 || s === status).map((s) => (
          <Link
            key={s}
            href={`/signals?status=${s}`}
            aria-current={status === s ? "page" : undefined}
            className={`rounded-full border px-3 py-1 ${status === s ? "border-primary text-foreground" : "border-border text-muted-foreground"}`}
          >
            {extractionStatusLabel(s)} · {countOf(s)}
          </Link>
        ))}
      </nav>
      <p className="mt-2 text-xs text-muted-foreground">
        Показаны последние 100 материалов{status ? " с этим статусом" : ""}.
      </p>
      <div className="mt-4 space-y-4">
        {raws.map((r) => (
          <article key={r.id} className="foundry-card rounded-xl p-5">
            <h2>{r.title}</h2>
            <p className="my-2 text-xs text-muted-foreground">
              {r.source.name} · {extractionStatusLabel(r.extractionStatus)} ·
              сигналов: {r.signals.length}
            </p>
            {r.extractionStatus === "failed" && (
              <p className="text-amber-300 text-sm">
                {failureNote(r.metadata)}
              </p>
            )}
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
                Нет пригодной публичной ссылки: материал исключён из анализа.
              </p>
            )}
            <details className="mt-3 text-xs">
              <summary>Происхождение и исходный текст</summary>
              <p className="my-2 break-all">
                Источник {r.sourceId} → материал {r.id}
              </p>
              <p className="whitespace-pre-wrap">
                {r.content
                  ? sourceDocument({ content: r.content, source: r.source })
                  : "Исходный текст отсутствует; доступен только заголовок."}
              </p>
              {r.signals.map((s) => (
                <div className="mt-4 border-t pt-3" key={s.id}>
                  <p>
                    Сигнал {s.id} · {signalTypeLabel(s.type)}
                  </p>
                  <p>{s.title}</p>
                  <p>Цитата: {s.description}</p>
                  <p>
                    Ключ группировки (англ.): {s.normalizedProblem || "Нет"}
                  </p>
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
