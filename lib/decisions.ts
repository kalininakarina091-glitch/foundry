import { z } from "zod";
// Personal decision statuses. Client-safe: no DB imports.
export const DECISION_STATUSES = {
  exploring: "Изучаю",
  building: "Развиваю",
  rejected: "Отказ",
} as const;
export type DecisionStatus = keyof typeof DECISION_STATUSES;
export const NOTE_MAX = 2000;
export const decisionSchema = z
  .object({
    opportunityId: z.string().min(1).max(200),
    status: z
      .enum(Object.keys(DECISION_STATUSES) as [DecisionStatus, ...DecisionStatus[]])
      .nullable(),
    note: z.string().max(NOTE_MAX).transform((s) => s.trim()),
  })
  .strict();
/** Nothing to keep: no status and no note. The record is removed. */
export function isEmptyDecision(d: { status: string | null; note: string }) {
  return !d.status && !d.note.trim();
}
export function decisionLabel(status: string | null | undefined): string | null {
  return status && Object.hasOwn(DECISION_STATUSES, status)
    ? DECISION_STATUSES[status as DecisionStatus]
    : null;
}
