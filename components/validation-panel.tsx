"use client";
import { useState } from "react";
import Link from "next/link";
import {
  DemoNotice,
  EmptyState,
  EvidenceCard,
  PageHeader,
} from "@/components/product-ui";
import { opportunityHref, type OpportunityView } from "@/lib/opportunity-types";
import { validationSchema, type ValidationReport } from "@/lib/validation";

const verdicts = {
  promising: "Перспективно",
  uncertain: "Нужны дополнительные данные",
  not_recommended: "Не рекомендуется",
};
const decisions = {
  BUILD: "Развивать",
  "RESEARCH MORE": "Исследовать дальше",
  SKIP: "Отказаться",
};
export default function ValidationPanel({
  opportunity,
}: {
  opportunity: OpportunityView;
}) {
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function validate() {
    setPending(true);
    setError(null);
    setReport(null);
    try {
      const res = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId: opportunity.id }),
        signal: AbortSignal.timeout(65000),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Проверка не завершена.");
      setReport(validationSchema.parse(data));
    } catch (e) {
      setError(
        e instanceof Error && e.name !== "ZodError"
          ? e.message
          : "Некорректный ответ проверки. Попробуйте снова.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="page-container">
      <Link
        href={opportunityHref(opportunity)}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← К возможности
      </Link>
      <div className="mt-7">
        <PageHeader
          eyebrow="Проверка / Validate"
          title={opportunity.title}
          description="Проверяем аргументы за и против на основе связанных материалов. Вывод помогает принять решение, но не гарантирует успех."
        />
      </div>
      {opportunity.demo ? (
        <>
          <DemoNotice />
          <EmptyState
            title="Демо не заменяет исследование"
            description="У этого примера нет рыночных доказательств. Для реальной проверки выберите возможность из базы проекта."
          >
            <Link className="button-primary" href="/opportunities">
              К возможностям
            </Link>
          </EmptyState>
        </>
      ) : (
        <>
          {!report && (
            <EmptyState
              title={
                pending
                  ? "Проверяем доказательства…"
                  : "Достаточно ли оснований для решения?"
              }
              description={
                pending
                  ? "Сопоставляем материалы и ищем противоречия. Обычно это занимает до минуты."
                  : `Связанных материалов: ${opportunity.evidence.length}. Проверка рассмотрит до 40 материалов. При недостатке данных результатом будет «Исследовать дальше».`
              }
            >
              <button
                className="button-primary"
                disabled={pending}
                onClick={validate}
              >
                {pending
                  ? "Проверка выполняется…"
                  : error
                    ? "Повторить проверку"
                    : "Проверить возможность"}
              </button>
            </EmptyState>
          )}
          {pending && (
            <p role="status" className="mt-4 text-sm text-muted-foreground">
              Анализ выполняется…
            </p>
          )}
          {error && (
            <p
              role="alert"
              className="mt-5 rounded-xl border border-red-400/25 bg-red-400/5 p-4 text-sm text-red-200"
            >
              {error}
            </p>
          )}
          {report && (
            <div className="space-y-8">
              <section className="foundry-card rounded-2xl p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-6">
                  <div>
                    <p className="eyebrow">Вердикт</p>
                    <h2 className="mt-3 text-2xl font-semibold">
                      {verdicts[report.verdict]}
                    </h2>
                    <p
                      className={`mt-4 inline-flex rounded-md border px-3 py-1.5 text-sm font-medium ${report.recommendation === "BUILD" ? "border-emerald-400/25 text-emerald-300" : report.recommendation === "SKIP" ? "border-red-400/25 text-red-300" : "border-amber-400/25 text-amber-200"}`}
                    >
                      {report.recommendation} ·{" "}
                      {decisions[report.recommendation]}
                    </p>
                  </div>
                  <div className="w-48">
                    <p className="text-sm text-muted-foreground">
                      Validation Confidence
                    </p>
                    <p className="my-2 text-3xl font-semibold tabular-nums">
                      {report.confidence}%
                    </p>
                    <meter
                      aria-label="Уверенность в выводе"
                      className="h-2 w-full"
                      min={0}
                      max={100}
                      value={report.confidence}
                    />
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      Уверенность в выводе, не вероятность успеха бизнеса.
                    </p>
                  </div>
                </div>
                <p className="mt-6 max-w-prose text-sm leading-7 text-muted-foreground">
                  {report.explanation}
                </p>
              </section>
              <div className="grid gap-6 md:grid-cols-2">
                <EvidenceList
                  title="Доказательства ЗА"
                  items={report.positive_evidence}
                  positive
                />
                <EvidenceList
                  title="Доказательства ПРОТИВ"
                  items={report.negative_evidence}
                />
              </div>
              <div className="grid gap-7 md:grid-cols-2">
                <ReportSection
                  title="Почему не стоит делать?"
                  body={report.why_not}
                />
                <ReportSection
                  title="Главный риск"
                  body={report.biggest_risk}
                />
              </div>
              <section className="border-t border-border pt-6">
                <ReportSection
                  title="Что изменит вердикт?"
                  body={report.what_would_change}
                />
              </section>
              <div className="flex flex-wrap items-center gap-4">
                <button className="button-secondary" onClick={validate}>
                  Проверить повторно
                </button>
                <p className="text-xs text-muted-foreground">
                  Результат не сохраняется после закрытия или обновления
                  страницы.
                </p>
              </div>
            </div>
          )}
          {opportunity.evidence.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-4 text-lg font-semibold">Материалы проверки</h2>
              <div className="space-y-3">
                {opportunity.evidence.slice(0, 40).map((e) => (
                  <div
                    id={`evidence-${e.id}`}
                    key={e.id}
                    className="scroll-mt-5"
                  >
                    <EvidenceCard evidence={e} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
function ReportSection({ title, body }: { title: string; body: string }) {
  return (
    <section>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-3 max-w-prose text-sm leading-7 text-muted-foreground">
        {body}
      </p>
    </section>
  );
}
function EvidenceList({
  title,
  items,
  positive = false,
}: {
  title: string;
  items: ValidationReport["positive_evidence"];
  positive?: boolean;
}) {
  return (
    <section className="rounded-xl border border-border p-5">
      <h3
        className={`mb-4 text-sm font-semibold ${positive ? "text-emerald-300" : "text-red-300"}`}
      >
        {title}
      </h3>
      {items.length ? (
        <ul className="space-y-4">
          {items.map((item, i) => (
            <li key={i} className="text-sm leading-6">
              <p>{item.claim}</p>
              <div className="mt-2 flex flex-wrap gap-3">
                {item.evidence_ids.map((id, n) => (
                  <a
                    href={`#evidence-${id}`}
                    key={`${id}-${n}`}
                    className="text-xs text-muted-foreground underline underline-offset-4"
                  >
                    Материал {n + 1}
                  </a>
                ))}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm leading-6 text-muted-foreground">
          Подтверждённых аргументов недостаточно. Это не доказывает обратное.
        </p>
      )}
    </section>
  );
}
