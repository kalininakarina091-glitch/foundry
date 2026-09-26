"use client";
import { useState, useSyncExternalStore } from "react";
import { Bookmark, Grid2X2, List, Search, Download } from "lucide-react";
import OpportunityCard from "@/components/opportunity-card";
import { usePreferences } from "@/lib/use-preferences";
import { EmptyState } from "@/components/product-ui";
import type { OpportunityView } from "@/lib/opportunity-types";
const storageKey = "foundry:bookmarks:v1";
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("foundry-bookmarks", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("foundry-bookmarks", callback);
  };
}
function snapshot() {
  try {
    return localStorage.getItem(storageKey) || "[]";
  } catch {
    return "[]";
  }
}
function bookmarkId(o: OpportunityView) {
  return `${o.demo ? "demo" : "project"}:${o.id}`;
}
function parseSaved(value: string): string[] {
  try {
    const result: unknown = JSON.parse(value);
    return Array.isArray(result)
      ? result.filter((v): v is string => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}
export default function OpportunityCatalog({
  opportunities,
  initialQuery = "",
  initialView = "all",
}: {
  opportunities: OpportunityView[];
  initialQuery?: string;
  initialView?: string;
}) {
  const preferences = usePreferences();
  const [query, setQuery] = useState(initialQuery);
  const [tab, setTab] = useState(initialView === "saved" ? "saved" : "all");
  const [category, setCategory] = useState("");
  const [score, setScore] = useState("");
  const [status, setStatus] = useState("");
  const [sortOverride, setSort] = useState<string | null>(null);
  const sort = sortOverride ?? preferences.catalogSort;
  const [layoutOverride, setLayout] = useState<string | null>(null);
  const layout = layoutOverride ?? preferences.catalogLayout;
  const [pagination, setPagination] = useState({ key: "", page: 1 });
  const [error, setError] = useState("");
  const saved = parseSaved(
    useSyncExternalStore(subscribe, snapshot, () => "[]"),
  );
  function toggleSave(o: OpportunityView) {
    const id = bookmarkId(o);
    const current = parseSaved(snapshot());
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(
          current.includes(id)
            ? current.filter((v) => v !== id)
            : [...current, id],
        ),
      );
      window.dispatchEvent(new Event("foundry-bookmarks"));
      setError("");
    } catch {
      setError(
        "Браузер не разрешает сохранение. Проверьте настройки хранилища.",
      );
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
            ? saved.includes(bookmarkId(o))
            : true;
  const tabs = [
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
      sort === "score"
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
            onClick={() => setTab(t.id)}
          >
            {t.label}
            <span>
              {opportunities.filter((o) => matchesTab(o, t.id)).length}
            </span>
          </button>
        ))}
      </div>
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
            <option value="score">По Score</option>
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
          Избранное хранится в этом браузере. Демо и данные проекта сохраняются
          отдельно.
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
              saved={saved.includes(bookmarkId(o))}
              onToggleSave={() => toggleSave(o)}
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
