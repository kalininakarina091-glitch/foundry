// Failure reasons are stored in RawItem metadata and logged. They never carry
// provider responses, source text or credentials. Client-safe: no DB imports.
export const MAX_EXTRACTION_ATTEMPTS = 3;
export const AI_FAILURE_LABELS = {
  provider_not_configured: "AI-провайдер не настроен",
  provider_timeout: "Провайдер не ответил вовремя",
  provider_unavailable: "Провайдер недоступен",
  provider_http: "Провайдер вернул ошибку",
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
