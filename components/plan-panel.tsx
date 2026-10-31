"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DEMAND_TEST_LABELS } from "@/lib/business-plan";
import type { StoredPlan } from "@/lib/plans";
import { EmptyState } from "@/components/product-ui";
const dateFormat = new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" });
function List({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground">
      {items.map((x) => (
        <li key={x}>{x}</li>
      ))}
    </ul>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}
export default function PlanPanel({
  opportunityId,
  stored,
  history,
  evidenceBase,
}: {
  opportunityId: string;
  stored: StoredPlan | null;
  history: { id: string; createdAt: string }[];
  /** Opportunity page URL; evidence cards there have #evidence-<id> anchors. */
  evidenceBase: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function build() {
    setPending(true);
    setError("");
    try {
      const r = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId }),
        signal: AbortSignal.timeout(90000),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "План не построен.");
      router.replace(`/plan/${encodeURIComponent(opportunityId)}?plan=${encodeURIComponent(data.id)}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setPending(false);
    }
  }
  const action = (
    <div className="flex flex-wrap items-center gap-3">
      <button className="button-primary" disabled={pending} onClick={build}>
        {pending ? "Строим план… (до минуты)" : stored ? "Построить заново" : "Построить план проверки"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
  if (!stored)
    return (
      <EmptyState
        title="Плана пока нет"
        description="План учитывает доказательства этой возможности, результат проверки (если она была) и ваш профиль: навыки, бюджет, время и команду."
      >
        {action}
      </EmptyState>
    );
  const { plan, places } = stored;
  return (
    <div className="space-y-6">
      <section className="foundry-card rounded-2xl p-6">
        <p className="eyebrow">Что проверяем</p>
        <p className="mt-2 leading-7">{plan.summary}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          План от {dateFormat.format(new Date(stored.createdAt))}. Это рекомендации для проверки, а
          не доказательство спроса; ориентиры по срокам и деньгам — оценки модели.
        </p>
      </section>
      <Section title="Главные допущения">
        <ol className="mt-2 list-decimal space-y-3 pl-5 text-sm leading-6">
          {plan.assumptions.map((a) => (
            <li key={a.text}>
              <p>{a.text}</p>
              <p className="text-muted-foreground">Почему рискованно: {a.why_risky}</p>
              {a.evidence_ids.length > 0 && (
                <p className="text-xs">
                  Опирается на:{" "}
                  {a.evidence_ids.map((id, i) => (
                    <Link key={id} className="text-primary" href={`${evidenceBase}#evidence-${id}`}>
                      доказательство {i + 1}
                      {i < a.evidence_ids.length - 1 ? ", " : ""}
                    </Link>
                  ))}
                </p>
              )}
            </li>
          ))}
        </ol>
      </Section>
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Кого опросить">
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{plan.interview.who}</p>
          <h3 className="mt-4 text-sm font-semibold">Где их найти — там, где они уже писали</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {places.map((p) => (
              <li key={p.source}>
                {p.source}
                {p.examples.map((url, i) => (
                  <a key={url} className="ml-2 text-xs text-primary" href={url} target="_blank" rel="noopener noreferrer">
                    пример {i + 1} ↗
                  </a>
                ))}
              </li>
            ))}
          </ul>
        </Section>
        <Section title="Вопросы для интервью">
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-6 text-muted-foreground">
            {plan.interview.questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ol>
        </Section>
      </div>
      <Section title={`Тест спроса: ${DEMAND_TEST_LABELS[plan.demand_test.method]}`}>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{plan.demand_test.description}</p>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Критерий успеха (ориентир)</dt>
            <dd>{plan.demand_test.success_criteria}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Срок</dt>
            <dd>{plan.demand_test.duration_days} дн.</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Затраты (оценка)</dt>
            <dd>{plan.demand_test.cost_estimate || "не оценены"}</dd>
          </div>
        </dl>
      </Section>
      <Section title="Первая версия продукта">
        <p className="mt-2 text-sm">Главная задача: {plan.mvp.core_job}</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold">Сделать</h3>
            <List items={plan.mvp.include} />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Сознательно не делать</h3>
            <List items={plan.mvp.exclude} />
          </div>
        </div>
      </Section>
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Следующие шаги">
          <List items={plan.next_steps} />
        </Section>
        <Section title="Чего мы не знаем">
          {plan.unknowns.length ? <List items={plan.unknowns} /> : <p className="mt-2 text-sm text-muted-foreground">Модель не указала пробелов.</p>}
        </Section>
      </div>
      {action}
      {history.length > 1 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold">Предыдущие планы</h2>
          <ul className="space-y-1 text-sm">
            {history.map((h) => (
              <li key={h.id}>
                <Link
                  className={h.id === stored.id ? "font-semibold" : "text-primary"}
                  href={`/plan/${encodeURIComponent(opportunityId)}?plan=${encodeURIComponent(h.id)}`}
                >
                  {dateFormat.format(new Date(h.createdAt))}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
