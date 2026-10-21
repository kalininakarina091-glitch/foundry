// Deterministic gate over the model's extraction: the model classifies the
// material, code decides whether it may become a demand signal.
export const MATERIAL_KINDS = [
  "own_problem",
  "solution_request",
  "bug_report",
  "news",
  "product_launch",
  "opinion",
  "other",
] as const;
export type MaterialKind = (typeof MATERIAL_KINDS)[number];
const SIGNAL_KINDS = new Set<MaterialKind>(["own_problem", "solution_request"]);
export type GateRejection = "kind_missing" | "not_a_need" | "no_pain_or_customer";
export function acceptSignal<
  T extends {
    is_relevant: boolean;
    material_kind?: MaterialKind;
    pain_point: string | null;
    customer: string | null;
  },
>(output: T): T & { rejected?: GateRejection } {
  if (!output.is_relevant) return output;
  const rejected: GateRejection | undefined = !output.material_kind
    ? "kind_missing"
    : !SIGNAL_KINDS.has(output.material_kind)
      ? "not_a_need"
      : !output.pain_point?.trim() && !output.customer?.trim()
        ? "no_pain_or_customer"
        : undefined;
  return rejected ? { ...output, is_relevant: false, rejected } : output;
}
