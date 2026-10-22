// Failure reasons are stored in RawItem metadata and logged. They never carry
// provider responses, source text or credentials. Client-safe: no DB imports.
export const MAX_EXTRACTION_ATTEMPTS = 3;
export const AI_FAILURE_LABELS = {
  provider_not_configured: "AI-провайдер не настроен",
  provider_timeout: "Провайдер не ответил вовремя",
  provider_unavailable: "Провайдер недоступен",
  provider_http: "Провайдер вернул ошибку",
  provider_credits: "Недостаточно кредитов OpenRouter",
  provider_rate_limit: "Превышен лимит запросов к провайдеру",
  invalid_response: "Пустой ответ провайдера",
  invalid_json: "Ответ модели не является JSON",
  invalid_schema: "Ответ модели не соответствует формату",
  quote_not_found: "Цитата модели не найдена в исходном тексте",
  unknown: "Неизвестная ошибка",
} as const;
export type AIFailureReason = keyof typeof AI_FAILURE_LABELS;
export class AIError extends Error {
  readonly reason: AIFailureReason;
  readonly httpStatus?: number;
  constructor(reason: AIFailureReason, httpStatus?: number) {
    super(reason);
    this.name = "AIError";
    this.reason = reason;
    if (httpStatus !== undefined) this.httpStatus = httpStatus;
  }
}
const PROVIDER_SIDE = new Set<string>([
  "provider_not_configured",
  "provider_timeout",
  "provider_unavailable",
  "provider_http",
  "provider_credits",
  "provider_rate_limit",
]);
/** Failures caused by the provider rather than by the model's answer. */
export function isProviderSide(reason: string): boolean {
  return PROVIDER_SIDE.has(reason);
}
/** AIError for a non-OK provider response, with specific reasons where actionable. */
export function httpFailure(status: number): AIError {
  return new AIError(
    status === 402
      ? "provider_credits"
      : status === 429
        ? "provider_rate_limit"
        : "provider_http",
    status,
  );
}
export function failureOf(error: unknown): {
  reason: AIFailureReason;
  httpStatus?: number;
} {
  if (error instanceof AIError)
    return error.httpStatus === undefined
      ? { reason: error.reason }
      : { reason: error.reason, httpStatus: error.httpStatus };
  if (error instanceof Error && error.name === "ZodError")
    return { reason: "invalid_schema" };
  return { reason: "unknown" };
}
export function failureLabel(reason: unknown): string {
  return typeof reason === "string" && Object.hasOwn(AI_FAILURE_LABELS, reason)
    ? AI_FAILURE_LABELS[reason as AIFailureReason]
    : AI_FAILURE_LABELS.unknown;
}
