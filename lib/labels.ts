// Russian labels for values stored in English codes. Stored codes stay
// unchanged; only their presentation is translated. Client-safe.
export const METRICS = {
  opportunityScore: "Оценка возможности",
  matchScore: "Соответствие вам",
  validationConfidence: "Уверенность проверки",
} as const;
const SIGNAL_TYPES: Record<string, string> = {
  pain: "Боль",
  demand: "Спрос",
  trend: "Тренд",
  complaint: "Жалоба",
  market_gap: "Незанятая ниша",
  regulatory: "Регулирование",
};
const EXTRACTION_STATUSES: Record<string, string> = {
  pending: "Ожидает обработки",
  processing: "Обрабатывается",
  extracted: "Сигнал найден",
  irrelevant: "Без сигнала",
  failed: "Ошибка извлечения",
  excluded: "Исключён",
};
const PATTERN_KINDS: Record<string, string> = {
  repeated_observation: "повторяющееся наблюдение",
  multiple_source_records: "несколько источников",
  reported_complaint: "есть жалобы",
  reported_demand: "есть прямой спрос",
};
const SOURCE_TYPES: Record<string, string> = {
  hackernews: "Hacker News",
  github: "GitHub",
  rss: "RSS-лента",
  reddit: "Reddit",
  producthunt: "Product Hunt",
};
export const RECOMMENDATIONS: Record<string, string> = {
  BUILD: "Развивать",
  "RESEARCH MORE": "Исследовать дальше",
  SKIP: "Отказаться",
};
const label = (map: Record<string, string>, value: string) =>
  Object.hasOwn(map, value) ? map[value] : value;
export const signalTypeLabel = (v: string) => label(SIGNAL_TYPES, v);
export const extractionStatusLabel = (v: string) =>
  label(EXTRACTION_STATUSES, v);
export const patternKindLabel = (v: string) => label(PATTERN_KINDS, v);
export const sourceTypeLabel = (v: string) => label(SOURCE_TYPES, v);
export const recommendationLabel = (v: string) => label(RECOMMENDATIONS, v);
