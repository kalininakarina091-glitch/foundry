"use client";
import { useState } from "react";
import OpportunityCard from "@/components/opportunity-card";
import { EmptyState } from "@/components/product-ui";
import type { OpportunityView } from "@/lib/opportunity-types";
export default function OpportunityCatalog({
  opportunities,
}: {
  opportunities: OpportunityView[];
}) {
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("");
  const [sort, setSort] = useState("recent");
  const industries = [
    ...new Set(
      opportunities
        .map((o) => o.industry)
        .filter((v): v is string => Boolean(v)),
    ),
  ];
  const filtered = opportunities.filter(
    (o) =>
      (!industry || o.industry === industry) &&
      `${o.title} ${o.description || ""}`
        .toLocaleLowerCase("ru")
        .includes(query.trim().toLocaleLowerCase("ru")),
  );
  if (sort === "score") filtered.sort((a, b) => b.score - a.score);
  if (sort === "evidence")
    filtered.sort((a, b) => b.evidence.length - a.evidence.length);
  return (
    <>
      <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <label className="text-xs text-muted-foreground">
          Поиск
          <input
            className="field mt-2"
            placeholder="Проблема или название"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="search"
          />
        </label>
        <label className="text-xs text-muted-foreground">
          Категория
          <select
            className="field mt-2"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
          >
            <option value="">Все категории</option>
            {industries.map((i) => (
              <option key={i}>{i}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-muted-foreground">
          Порядок
          <select
            className="field mt-2"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="recent">Сначала новые</option>
            <option value="evidence">Больше доказательств</option>
            <option value="score">Выше Score</option>
          </select>
        </label>
      </div>
      <p className="mb-4 text-xs text-muted-foreground" role="status">
        Показано {filtered.length} из {opportunities.length}
      </p>
      {filtered.length ? (
        <div className="space-y-4">
          {filtered.map((o) => (
            <OpportunityCard key={o.id} opportunity={o} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Нет совпадений"
          description="Попробуйте другую формулировку или сбросьте фильтры."
        >
          <button
            className="button-secondary"
            onClick={() => {
              setQuery("");
              setIndustry("");
            }}
          >
            Сбросить фильтры
          </button>
        </EmptyState>
      )}
    </>
  );
}
