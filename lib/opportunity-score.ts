// Opportunity Score v2: several market dimensions, each with an explicit
// basis in stored data. A dimension without data is "unknown" and excluded,
// never treated as zero or as a match; coverage tells how much was measured.
// Opportunity-level and user-independent; Match Score and Validation
// Confidence are separate.
export type DimensionId = "evidence" | "demand" | "recency" | "monetization";
export interface Dimension {
  id: DimensionId;
  label: string;
  weight: number;
  value: number | null;
  basis: string;
}
export interface OpportunityScore {
  overall: number;
  /** Share of total weight backed by data, 0-100. */
  coverage: number;
  dimensions: Dimension[];
  method: "opportunity-score-v2";
}
export interface ScoredSignal {
  id: string;
  strength: number;
  /** own_problem | solution_request | ... from extraction metadata, if known. */
  materialKind: string | null;
  publishedAt: Date | null;
}
const WEIGHTS: Record<DimensionId, number> = {
  evidence: 35,
  demand: 25,
  recency: 15,
  monetization: 25,
};
const RECENT_DAYS = 180;
const pct = (x: number) => Math.round(100 * Math.max(0, Math.min(1, x)));
/** The material kind recorded at extraction or at a later recheck. */
export function materialKindOf(metadata: string | null | undefined): string | null {
  try {
    const extraction = JSON.parse(metadata || "{}")?.extraction;
    const kind = extraction?.recheck?.materialKind ?? extraction?.materialKind;
    return typeof kind === "string" ? kind : null;
  } catch {
    return null;
  }
}
export function scoreOpportunity(input: {
  signals: ScoredSignal[];
  /** evidence-support-v1 result for the same signals. */
  evidence: { overall: number; materials: number; sources: number };
  /** Signal ids the generating model cited as showing spending; null = not assessed. */
  monetizationSignalIds: string[] | null;
  now?: Date;
}): OpportunityScore {
  const { signals, evidence } = input;
  const now = input.now ?? new Date();
  const ids = new Set(signals.map((s) => s.id));
  const dims: Dimension[] = [];

  dims.push({
    id: "evidence",
    label: "Доказательства",
    weight: WEIGHTS.evidence,
    value: signals.length ? evidence.overall : null,
    basis: signals.length
      ? `${evidence.materials} материалов из ${evidence.sources} источников`
      : "Нет проверяемых материалов",
  });

  const kinds = signals.map((s) => s.materialKind).filter((k): k is string => !!k);
  const seeking = kinds.filter((k) => k === "solution_request").length;
  const intensity = signals.length
    ? signals.reduce((a, s) => a + Math.max(0, Math.min(1, s.strength)), 0) / signals.length
    : 0;
  dims.push({
    id: "demand",
    label: "Выраженность спроса",
    weight: WEIGHTS.demand,
    value: kinds.length ? pct(0.4 * (seeking / kinds.length) + 0.6 * intensity) : null,
    basis: kinds.length
      ? `${seeking} из ${kinds.length} авторов ищут решение; средняя сила сигнала ${pct(intensity)}%`
      : "Тип материалов не определён (сигналы извлечены до классификации)",
  });

  const dated = signals.filter((s) => s.publishedAt);
  const recent = dated.filter(
    (s) => now.getTime() - s.publishedAt!.getTime() <= RECENT_DAYS * 86400000,
  ).length;
  dims.push({
    id: "recency",
    label: "Актуальность",
    weight: WEIGHTS.recency,
    value: dated.length ? pct(recent / dated.length) : null,
    basis: dated.length
      ? `${recent} из ${dated.length} материалов опубликованы за последние 6 месяцев`
      : "Нет дат публикации",
  });

  // Only ids of this opportunity's own signals count; absence of a mention is
  // not evidence that nobody pays, so an empty list stays unknown.
  const paying = [...new Set(input.monetizationSignalIds ?? [])].filter((id) => ids.has(id));
  dims.push({
    id: "monetization",
    label: "Готовность платить",
    weight: WEIGHTS.monetization,
    value: paying.length ? Math.min(100, 50 * paying.length) : null,
    basis: paying.length
      ? `${paying.length} материалов прямо упоминают траты денег или платные инструменты`
      : input.monetizationSignalIds === null
        ? "Не оценивалась (возможность создана до этой оценки)"
        : "В источниках нет упоминаний трат или оплаты",
  });

  const known = dims.filter((d) => d.value !== null);
  const totalWeight = known.reduce((a, d) => a + d.weight, 0);
  return {
    overall: totalWeight
      ? Math.round(known.reduce((a, d) => a + d.weight * d.value!, 0) / totalWeight)
      : 0,
    coverage: totalWeight,
    dimensions: dims,
    method: "opportunity-score-v2",
  };
}
