import Link from "next/link";
import { ArrowUpRight, Layers3 } from "lucide-react";
import { safeSourceUrl, type EvidenceView } from "@/lib/opportunity-types";

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-9 flex flex-wrap items-end justify-between gap-5">
      <div className="max-w-2xl">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="page-title">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {children}
    </header>
  );
}
export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="foundry-card rounded-2xl px-6 py-12 text-center">
      <Layers3
        className="mx-auto mb-4 size-7 text-muted-foreground"
        aria-hidden
      />
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {children && (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {children}
        </div>
      )}
    </section>
  );
}
export function DemoNotice() {
  return (
    <div className="mb-7 rounded-xl border border-amber-400/25 bg-amber-400/5 px-4 py-3 text-sm leading-6 text-amber-200">
      <strong>Демонстрационные данные.</strong> Примеры показывают устройство
      продукта. Оценки и выводы не подтверждены рыночными источниками.
      <Link href="/opportunities" className="ml-2 underline underline-offset-4">
        К данным проекта →
      </Link>
    </div>
  );
}
export function ScoreBadge({ score }: { score: number }) {
  return (
    <div
      className="shrink-0 text-right"
      title="Предварительная оценка привлекательности, не уверенность в выводе"
    >
      <p className="text-xs text-muted-foreground">Opportunity Score</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">
        {score}
        <span className="ml-1 text-sm font-normal text-muted-foreground">
          /100
        </span>
      </p>
    </div>
  );
}
const statuses: Record<string, string> = {
  new: "К исследованию",
  saved: "Сохранено",
  validated: "Проверялась ранее",
  skipped: "Отложено",
  demo: "Демо",
};
export function StatusBadge({ status }: { status: string }) {
  return <span className="badge">{statuses[status] || "К исследованию"}</span>;
}
export function EvidenceCard({ evidence }: { evidence: EvidenceView }) {
  const url = safeSourceUrl(evidence.url);
  const tones: Record<string, string> = {
    positive: "text-emerald-300",
    negative: "text-red-300",
    neutral: "text-muted-foreground",
  };
  const labels: Record<string, string> = {
    positive: "В пользу",
    negative: "Против",
    neutral: "Контекст",
  };
  return (
    <article className="rounded-xl border border-border p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className={tones[evidence.type] || tones.neutral}>
          {labels[evidence.type] || "Контекст"} · {evidence.signalType}
        </span>
        <span className="text-muted-foreground">
          Сила сигнала{" "}
          {Math.round(Math.max(0, Math.min(1, evidence.strength)) * 100)}%
        </span>
      </div>
      <h3 className="mt-3 text-sm font-medium leading-6">
        {evidence.claim || evidence.signalTitle || "Вывод не сформулирован"}
      </h3>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>
          {evidence.source} ·{" "}
          {new Date(evidence.date).toLocaleDateString("ru-RU", {
            timeZone: "UTC",
          })}
        </span>
        {url ? (
          <a
            className="inline-flex items-center gap-1 text-foreground hover:text-primary"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Открыть источник <ArrowUpRight className="size-3" />
          </a>
        ) : (
          <span>Ссылка на источник отсутствует</span>
        )}
      </div>
      <details className="mt-3 text-xs text-muted-foreground">
        <summary className="cursor-pointer">Происхождение</summary>
        <p className="mt-2 break-all leading-5">
          Источник: {evidence.sourceId} → запись: {evidence.rawItemId} → сигнал:{" "}
          {evidence.signalId} → доказательство: {evidence.id}
        </p>
      </details>
    </article>
  );
}
