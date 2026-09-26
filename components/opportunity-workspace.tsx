"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChartNoAxesColumnIncreasing,
  Lightbulb,
  Users,
  Zap,
  Search,
  ArrowUpRight,
} from "lucide-react";
import { EmptyState, StatusBadge } from "@/components/product-ui";
import {
  opportunityHref,
  safeSourceUrl,
  type OpportunityView,
} from "@/lib/opportunity-types";
export function ScoreRing({ score }: { score: number }) {
  const value = Math.max(0, Math.min(100, score));
  return (
    <span
      className={`score-ring ${value >= 80 ? "high" : ""}`}
      title="Opportunity Score — оценка привлекательности"
      aria-label={`Score: ${score} из 100`}
    >
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <circle className="score-track" cx="20" cy="20" r="17" />
        <circle
          className="score-progress"
          cx="20"
          cy="20"
          r="17"
          pathLength="100"
          strokeDasharray={`${value} 100`}
        />
      </svg>
      <span>{score}</span>
    </span>
  );
}
const tabs = [
  { id: "overview", label: "Обзор" },
  { id: "signals", label: "Рыночные сигналы" },
  { id: "market", label: "Рынок" },
  { id: "competition", label: "Конкуренция" },
  { id: "monetization", label: "Монетизация" },
  { id: "risks", label: "Риски" },
] as const;
type Tab = (typeof tabs)[number]["id"];
export default function OpportunityWorkspace({
  opportunities,
  initialQuery = "",
}: {
  opportunities: OpportunityView[];
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("score");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const filtered = opportunities
    .filter(
      (o) =>
        (!category || o.industry === category) &&
        (!status || o.status === status) &&
        `${o.title} ${o.description ?? ""} ${o.industry ?? ""}`
          .toLocaleLowerCase("ru")
          .includes(query.trim().toLocaleLowerCase("ru")),
    )
    .sort((a, b) =>
      sort === "score"
        ? b.score - a.score
        : sort === "evidence"
          ? b.evidence.length - a.evidence.length
          : (b.createdAt ?? "").localeCompare(a.createdAt ?? ""),
    );
  const selected = filtered.find((o) => o.id === selectedId) ?? filtered[0];
  const categories = [
    ...new Set(
      opportunities
        .map((o) => o.industry)
        .filter((v): v is string => Boolean(v)),
    ),
  ];
  if (!opportunities.length)
    return (
      <EmptyState
        title="Ваше следующее открытие начинается здесь"
        description="Добавьте источники и соберите сигналы. Найденные возможности появятся в этом обзоре."
      >
        <Link className="button-primary" href="/sources">
          Добавить источники <ArrowRight size={16} className="ml-2" />
        </Link>
        <Link className="button-secondary" href="/dashboard?mode=demo">
          Посмотреть демо
        </Link>
      </EmptyState>
    );
  return (
    <div className="workspace-stack">
      <section
        className="workspace-panel"
        aria-labelledby="opportunities-title"
      >
        <div className="workspace-toolbar">
          <div>
            <h2 id="opportunities-title">Перспективные возможности</h2>
            <p>Исследуйте проблемы с наиболее сильными рыночными сигналами.</p>
          </div>
          <div className="table-filters">
            <label className="sr-only" htmlFor="category">
              Категория
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Все категории</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <label className="sr-only" htmlFor="status">
              Статус
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Все статусы</option>
              <option value="new">К исследованию</option>
              <option value="saved">Сохранено</option>
              <option value="validated">Проверялась ранее</option>
              <option value="skipped">Отложено</option>
              <option value="demo">Демо</option>
            </select>
            <label className="sr-only" htmlFor="sort">
              Сортировка
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="score">По Score</option>
              <option value="evidence">По доказательствам</option>
              <option value="recent">Сначала новые</option>
            </select>
          </div>
        </div>
        <div className="table-search">
          <Search size={16} aria-hidden="true" />
          <input
            aria-label="Поиск возможностей"
            type="search"
            placeholder="Найти возможность или проблему…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span role="status">
            {filtered.length} из {opportunities.length}
          </span>
        </div>
        {filtered.length ? (
          <div className="opportunity-table-scroll">
            <table className="opportunity-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Возможность</th>
                  <th>Проблема</th>
                  <th>Категория</th>
                  <th>Score</th>
                  <th>Доказательства</th>
                  <th>Статус</th>
                  <th>
                    <span className="sr-only">Открыть</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o, index) => (
                  <tr
                    key={o.id}
                    className={selected?.id === o.id ? "selected" : ""}
                  >
                    <td>{index + 1}</td>
                    <td>
                      <button
                        className="opportunity-select"
                        aria-pressed={selected?.id === o.id}
                        onClick={() => {
                          setSelectedId(o.id);
                          setTab("overview");
                        }}
                      >
                        {o.title}
                      </button>
                    </td>
                    <td>
                      <p className="table-problem">
                        {o.problem || "Требует исследования"}
                      </p>
                    </td>
                    <td>
                      <span className="category-chip">
                        {o.industry || "Не задана"}
                      </span>
                    </td>
                    <td>
                      <ScoreRing score={o.score} />
                    </td>
                    <td>
                      <div className="evidence-count">
                        <ChartNoAxesColumnIncreasing size={22} />
                        <span>
                          {o.evidence.length}
                          <small>
                            {o.evidence.length ? "Материалов" : "Нет данных"}
                          </small>
                        </span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={o.status} />
                    </td>
                    <td>
                      <Link
                        className="table-open"
                        aria-label={`Открыть: ${o.title}`}
                        href={opportunityHref(o)}
                      >
                        <ArrowUpRight size={17} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8">
            <EmptyState
              title="Нет совпадений"
              description="Попробуйте другой запрос или сбросьте фильтры."
            >
              <button
                className="button-secondary"
                onClick={() => {
                  setQuery("");
                  setCategory("");
                  setStatus("");
                }}
              >
                Сбросить фильтры
              </button>
            </EmptyState>
          </div>
        )}
      </section>
      {selected && (
        <section
          className="workspace-panel opportunity-preview"
          aria-label="Выбранная возможность"
        >
          <div className="preview-topline">
            <span className="eyebrow">В фокусе исследования</span>
            <Link
              className="button-primary"
              href={`/validation/${encodeURIComponent(selected.id)}${selected.demo ? "?mode=demo" : ""}`}
            >
              Проверить возможность <ArrowRight size={16} />
            </Link>
          </div>
          <div className="preview-heading">
            <span className="preview-icon">
              <Lightbulb size={26} />
            </span>
            <div className="preview-title">
              <h2>{selected.title}</h2>
              <p>{selected.description || "Описание ещё не добавлено."}</p>
            </div>
            <div className="preview-score">
              <ScoreRing score={selected.score} />
              <span>
                Opportunity
                <br />
                Score
              </span>
            </div>
            <div className="preview-evidence">
              <strong>{selected.evidence.length}</strong>
              <span>Доказательств</span>
            </div>
          </div>
          <div className="preview-tabs" aria-label="Разделы возможности">
            {tabs.map((t) => (
              <button
                key={t.id}
                aria-pressed={tab === t.id}
                className={tab === t.id ? "active" : ""}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          {tab === "overview" ? (
            <div className="preview-grid">
              <div className="preview-facts">
                {[
                  {
                    title: "Проблема",
                    value: selected.problem,
                    icon: Lightbulb,
                  },
                  {
                    title: "Целевой клиент",
                    value: selected.customer,
                    icon: Users,
                  },
                  { title: "Почему сейчас", value: selected.whyNow, icon: Zap },
                ].map(({ title, value, icon: Icon }) => (
                  <div className="preview-fact" key={title}>
                    <span>
                      <Icon size={18} />
                    </span>
                    <div>
                      <h3>{title}</h3>
                      <p>
                        {value ||
                          "Недостаточно данных. Требуется исследование."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <SignalSummary opportunity={selected} />
              <EvidenceSummary opportunity={selected} />
            </div>
          ) : tab === "signals" ? (
            <SignalSummary opportunity={selected} />
          ) : (
            <div className="preview-text">
              <h3>{tabs.find((t) => t.id === tab)?.label}</h3>
              <p>
                {tab === "risks"
                  ? selected.risks.join(" · ") ||
                    "Риски ещё не исследованы. Отсутствие данных не означает отсутствие рисков."
                  : selected[tab] ||
                    "Недостаточно данных. Этот аспект ещё предстоит исследовать."}
              </p>
            </div>
          )}
          <Link
            className="preview-detail-link"
            href={opportunityHref(selected)}
          >
            Открыть полное исследование <ArrowRight size={15} />
          </Link>
        </section>
      )}
    </div>
  );
}
function SignalSummary({ opportunity }: { opportunity: OpportunityView }) {
  return (
    <div className="preview-box">
      <h3>
        Рыночные сигналы <span>({opportunity.evidence.length})</span>
      </h3>
      {opportunity.evidence.length ? (
        <ul className="signal-list">
          {opportunity.evidence.slice(0, 4).map((e) => {
            const url = safeSourceUrl(e.url);
            return (
              <li key={e.id}>
                <span className="source-monogram" aria-hidden="true">
                  {e.source.slice(0, 1).toUpperCase()}
                </span>
                <div>
                  <p>{e.claim || e.signalTitle || "Вывод не сформулирован"}</p>
                  <small>
                    {e.source} ·{" "}
                    {new Date(e.date).toLocaleDateString("ru-RU", {
                      timeZone: "UTC",
                    })}
                  </small>
                </div>
                {url && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Источник: ${e.source}`}
                  >
                    <ArrowUpRight size={15} />
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="preview-empty">
          Пока нет связанных материалов. Добавьте доказательства на странице
          исследования.
        </p>
      )}
    </div>
  );
}
function EvidenceSummary({ opportunity }: { opportunity: OpportunityView }) {
  const positive = opportunity.evidence.filter(
    (e) => e.type === "positive",
  ).length;
  const negative = opportunity.evidence.filter(
    (e) => e.type === "negative",
  ).length;
  const neutral = opportunity.evidence.length - positive - negative;
  const total = opportunity.evidence.length;
  return (
    <div className="preview-box">
      <h3>Баланс доказательств</h3>
      <div
        className="evidence-bar"
        aria-label={`${positive} в пользу, ${negative} против, ${neutral} контекст`}
      >
        {total > 0 && (
          <>
            <span
              className="positive"
              style={{ width: `${(positive / total) * 100}%` }}
            />
            <span
              className="negative"
              style={{ width: `${(negative / total) * 100}%` }}
            />
            <span
              className="neutral"
              style={{ width: `${(neutral / total) * 100}%` }}
            />
          </>
        )}
      </div>
      <div className="evidence-legend">
        <span>
          <i className="positive" />
          {positive} в пользу
        </span>
        <span>
          <i className="negative" />
          {negative} против
        </span>
        <span>
          <i className="neutral" />
          {neutral} контекст
        </span>
      </div>
      <div className="research-note">
        <Lightbulb size={19} />
        <p>
          {total
            ? "Изучите источники и противоречия перед проверкой гипотезы."
            : "Для обоснованного вывода нужны реальные источники."}{" "}
          Уверенность появится в результате проверки.
        </p>
      </div>
    </div>
  );
}
