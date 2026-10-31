// Turns pipeline counters into actionable hints. Pure: no DB access.
export interface PipelineCounts {
  activeSources: number;
  pending: number;
  failed: number;
  signals: number;
  /** Signals that went through normalization (incl. duplicates). */
  normalizedSignals: number;
  clusterableSignals: number;
  /** Clusterable signals with a vector of the current embedding model. */
  embeddedSignals: number;
  aiConfigured: boolean;
  lastSyncAt: Date | null;
  lastExtractAt: Date | null;
}
export interface Hint {
  level: "warn" | "info";
  text: string;
  href?: string;
}
const HOUR = 3600000;
const ago = (d: Date, now: Date) => {
  const h = Math.floor((now.getTime() - d.getTime()) / HOUR);
  return h < 48 ? `${h} ч назад` : `${Math.floor(h / 24)} дн. назад`;
};
export function pipelineHints(c: PipelineCounts, now = new Date()): Hint[] {
  const hints: Hint[] = [];
  if (!c.activeSources)
    hints.push({ level: "warn", text: "Нет включённых источников: новые материалы не появятся.", href: "/sources" });
  if (!c.aiConfigured)
    hints.push({ level: "warn", text: "AI-ключ не задан: извлечение сигналов, генерация и проверка не работают." });
  if (c.activeSources && (!c.lastSyncAt || now.getTime() - c.lastSyncAt.getTime() > 48 * HOUR))
    hints.push({
      level: "warn",
      text: c.lastSyncAt
        ? `Последняя синхронизация была ${ago(c.lastSyncAt, now)}. Автосбор обновляет источники раз в сутки — проверьте его запуски в GitHub → Actions.`
        : "Источники ещё ни разу не синхронизировались.",
      href: "/sources",
    });
  if (c.failed)
    hints.push({ level: "warn", text: `Материалов с ошибкой извлечения: ${c.failed}. Нажмите «Повторить неудачные».` });
  if (c.pending && c.aiConfigured && (!c.lastExtractAt || now.getTime() - c.lastExtractAt.getTime() > 6 * HOUR))
    hints.push({
      level: "info",
      text: `В очереди ${c.pending} материалов. Нажмите «Запустить обработку» или дождитесь автосбора.`,
    });
  const outside = c.signals - c.normalizedSignals;
  if (outside > 0)
    hints.push({
      level: "info",
      text: `Сигналов вне группировки: ${outside} — ещё не нормализованы или исключены (нет цитаты или ссылки, перепроверка). Если вы только что извлекали сигналы, нажмите «Нормализовать сигналы».`,
    });
  const missing = c.clusterableSignals - c.embeddedSignals;
  if (missing > 0 && c.aiConfigured)
    hints.push({
      level: "info",
      text: `У ${missing} сигналов нет эмбеддингов текущей модели: группировка для них идёт по словам. Нажмите «Нормализовать сигналы».`,
    });
  return hints;
}
