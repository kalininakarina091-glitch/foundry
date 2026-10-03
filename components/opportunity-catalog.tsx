"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { personalRank, type MatchResult } from "@/lib/personalization";
import { Bookmark, Grid2X2, List, Search, Download } from "lucide-react";
import OpportunityCard from "@/components/opportunity-card";
import { usePreferences } from "@/lib/use-preferences";
import { EmptyState } from "@/components/product-ui";
import type { OpportunityView } from "@/lib/opportunity-types";
export default function OpportunityCatalog({
  opportunities,
  initialQuery = "",
  initialView = "for-you",
}: {
  opportunities: OpportunityView[];
  initialQuery?: string;
  initialView?: string;
}) {
  const preferences = usePreferences();
  const [query, setQuery] = useState(initialQuery);
  const [tab, setTab] = useState(
    ["saved", "all"].includes(initialView) ? initialView : "for-you",
  );
  const [category, setCategory] = useState("");
  const [score, setScore] = useState("");
  const [status, setStatus] = useState("");
  const [sortOverride, setSort] = useState<string | null>(null);
  const sort =
    sortOverride ?? (tab === "for-you" ? "match" : preferences.catalogSort);
  const [layoutOverride, setLayout] = useState<string | null>(null);
  const layout = layoutOverride ?? preferences.catalogLayout;
  const [pagination, setPagination] = useState({ key: "", page: 1 });
  const [error, setError] = useState("");
  const [personal, setPersonal] = useState<{
    saved: string[];
    dismissed: string[];
    limited: boolean;
    matches: Record<string, MatchResult>;
  } | null>(null);
  useEffect(() => {
    let active = true;
    fetch("/api/me/catalog", { cache: "no-store" })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        if (active) setPersonal(data);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  const saved = personal?.saved || [];
  async function action(o: OpportunityView, kind: "saved" | "feedback") {
    if (o.demo) {
      setError("Демонстрационные возможности не сохраняются в аккаунте.");
      return;
    }
    const key = kind === "saved" ? "saved" : "dismissed";
    const active = !(personal?.[key] || []).includes(o.id);
    try {
      const r = await fetch("/api/me/" + kind, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId: o.id, active }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setPersonal((p) =>
        p
          ? {
              ...p,
              [key]: active
                ? [...new Set([...p[key], o.id])]
                : p[key].filter((id) => id !== o.id),
              matches:
                kind === "feedback" && p.matches[o.id]
                  ? {
                      ...p.matches,
                      [o.id]: {
                        ...p.matches[o.id],
                        feedbackPenalty: active ? 5 : 0,
                      },
                    }
                  : p.matches,
            }
          : p,
      );
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить");
    }
  }
  const matchesTab = (o: OpportunityView, value: string) =>
    value === "high"
      ? o.score >= 80
      : value === "research"
        ? o.status === "new"
        : value === "reviewed"
          ? o.status === "validated"
          : value === "saved"
            ? saved.includes(o.id)
            : true;
  const tabs = [
    { id: "for-you", label: "Для вас" },
    { id: "all", label: "Все возможности" },
    { id: "high", label: "Score 80+" },
    { id: "research", label: "К исследованию" },
    { id: "reviewed", label: "Проверялись ранее" },
    { id: "saved", label: "Избранное" },
  ];
  const filtered = opportunities
    .filter(
      (o) =>
        matchesTab(o, tab) &&
        (!category || o.industry === category) &&
        (!status || o.status === status) &&
        (!score || (score === "80" ? o.score >= 80 : o.score < 80)) &&
        `${o.title} ${o.description ?? ""} ${o.industry ?? ""}`
          .toLocaleLowerCase("ru")
          .includes(query.trim().toLocaleLowerCase("ru")),
    )
    .sort((a, b) =>
      sort === "match"
        ? personalRank(
            personal?.matches[b.id] ||
              ({ score: null, feedbackPenalty: 0 } as MatchResult),
          ) -
            personalRank(
              personal?.matches[a.id] ||
                ({ score: null, feedbackPenalty: 0 } as MatchResult),
            ) || b.score - a.score
        : sort === "score"
          ? b.score - a.score
          : sort === "evidence"
            ? b.evidence.length - a.evidence.length
            : (b.createdAt ?? "").localeCompare(a.createdAt ?? ""),
    );
  const paginationKey = JSON.stringify([
    query,
    tab,
    category,
    score,
    status,
    sort,
    preferences.pageSize,
  ]);
  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / preferences.pageSize),
  );
  const page =
    pagination.key === paginationKey
      ? Math.min(pagination.page, totalPages)
      : 1;
  const pageItems = filtered.slice(
    (page - 1) * preferences.pageSize,
    page * preferences.pageSize,
  );
  function exportReport() {
    const report = {
      exportedAt: new Date().toISOString(),
      note: "Score is not validation confidence. Validation reports are not persisted.",
      opportunities: filtered,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "foundry-opportunities.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <>
      <div className="catalog-tabs" aria-label="Группы возможностей">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? "active" : ""}
            aria-pressed={tab === t.id}
            onClick={() => {
              setTab(t.id);
              setSort(null);
            }}
          >
            {t.label}
            <span>
              {opportunities.filter((o) => matchesTab(o, t.id)).length}
            </span>
          </button>
        ))}
      </div>
      {tab === "for-you" && (
        <div className="personal-notice">
          <strong>
            Match Score ≠ Opportunity Score ≠ Validation Confidence
          </strong>
          <p>
            {!personal
              ? "Загружаем профиль…"
              : personal.limited
                ? "Профиль не завершён: персонализация ограничена."
                : "Ранжирование по известным атрибутам и вашим предпочтениям."}{" "}
            Неизвестные факторы не выдумываются. «Не для меня» снижает только
            персональную позицию на 5 пунктов.
          </p>
          <Link href="/settings/personalization">Изменить профиль →</Link>
        </div>
      )}
      <div className="catalog-controls">
        <div className="table-filters">
          <select
            aria-label="Категория"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Все категории</option>
            {[
              ...new Set(
                opportunities
                  .map((o) => o.industry)
                  .filter((v): v is string => Boolean(v)),
              ),
            ].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            aria-label="Оценка"
            value={score}
            onChange={(e) => setScore(e.target.value)}
          >
            <option value="">Любой Score</option>
            <option value="80">80 и выше</option>
            <option value="below">Ниже 80</option>
          </select>
          <select
            aria-label="Статус"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Все статусы</option>
            <option value="new">К исследованию</option>
            <option value="validated">Проверялась ранее</option>
            <option value="saved">Сохранено в проекте</option>
            <option value="skipped">Отложено</option>
            <option value="demo">Демо</option>
          </select>
          <select
            aria-label="Сортировка"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            {tab === "for-you" && <option value="match">По Match Score</option>}
            <option value="score">По Opportunity Score</option>
            <option value="evidence">По доказательствам</option>
            <option value="recent">Сначала новые</option>
          </select>
        </div>
        <div className="layout-toggle">
          <button
            aria-label="Сетка"
            aria-pressed={layout === "grid"}
            onClick={() => setLayout("grid")}
          >
            <Grid2X2 size={15} />
            Сетка
          </button>
          <button
            aria-label="Список"
            aria-pressed={layout === "list"}
            onClick={() => setLayout("list")}
          >
            <List size={16} />
            Список
          </button>
        </div>
      </div>
      <div className="catalog-search-row">
        <label>
          <Search size={15} />
          <input
            aria-label="Поиск возможностей"
            type="search"
            placeholder="Найти возможность или проблему…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <span role="status">
          {filtered.length} из {opportunities.length}
        </span>
        <button
          className="catalog-export"
          onClick={exportReport}
          disabled={!filtered.length}
        >
          <Download size={14} />
          Экспорт JSON
        </button>
      </div>
      {tab === "saved" && (
        <p className="bookmark-note">
          <Bookmark size={14} />
          Избранное сохраняется на сервере только для вашего аккаунта.
        </p>
      )}
      {error && (
        <p role="alert" className="mb-4 text-sm text-red-300">
          {error}
        </p>
      )}
      {filtered.length ? (
        <div
          className={`opportunity-grid ${layout === "list" ? "list-layout" : ""}`}
        >
          {pageItems.map((o) => (
            <OpportunityCard
              key={o.id}
              opportunity={o}
              saved={saved.includes(o.id)}
              onToggleSave={() => action(o, "saved")}
              match={tab === "for-you" ? personal?.matches[o.id] : undefined}
              dismissed={personal?.dismissed.includes(o.id) || false}
              onDismiss={() => action(o, "feedback")}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={tab === "saved" ? "В избранном пока пусто" : "Нет совпадений"}
          description={
            tab === "saved"
              ? "Нажмите на закладку в карточке, чтобы вернуться к возможности позже."
              : "Измените запрос или сбросьте фильтры."
          }
        >
          <button
            className="button-secondary"
            onClick={() => {
              setQuery("");
              setCategory("");
              setScore("");
              setStatus("");
              setTab("all");
            }}
          >
            Показать все
          </button>
        </EmptyState>
      )}
      {filtered.length > 0 && (
        <nav className="catalog-pagination" aria-label="Страницы возможностей">
          <span>
            Страница {page} из {totalPages} · {filtered.length} результатов
          </span>
          <div>
            <button
              className="button-secondary"
              disabled={page <= 1}
              onClick={() =>
                setPagination({ key: paginationKey, page: page - 1 })
              }
            >
              ← Назад
            </button>
            <button
              className="button-secondary"
              disabled={page >= totalPages}
              onClick={() =>
                setPagination({ key: paginationKey, page: page + 1 })
              }
            >
              Далее →
            </button>
          </div>
        </nav>
      )}
    </>
  );
}
