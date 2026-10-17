import { z } from "zod";
import type { PersonalProfile } from "./personal-profile.ts";
export const attributeSchema = z
  .object({
    industries: z.array(z.string()).optional(),
    businessTypes: z.array(z.string()).optional(),
    markets: z.array(z.string()).optional(),
    teams: z.array(z.string()).optional(),
    minBudgetUsd: z.number().nonnegative().optional(),
    hoursPerWeek: z.number().positive().optional(),
    skills: z.array(z.string()).optional(),
    basis: z.string().min(1),
  })
  .strict();
export type MatchAttributes = z.infer<typeof attributeSchema>;
export interface MatchResult {
  score: number | null;
  coverage: number;
  reasons: string[];
  unknown: string[];
  limited: boolean;
  feedbackPenalty: number;
}
export function matchOpportunity(
  profile: PersonalProfile,
  attributes: MatchAttributes | null,
  dismissed = false,
): MatchResult {
  const reasons: string[] = [],
    unknown: string[] = [];
  let total = 0,
    earned = 0;
  function factor(
    label: string,
    weight: number,
    known: boolean,
    match: number,
    yes: string,
    no: string,
  ) {
    if (!known) {
      unknown.push(label);
      return;
    }
    total += weight;
    earned += weight * match;
    reasons.push(match > 0 ? yes : no);
  }
  const a = attributes;
  const overlap = (x: string[], y: string[]) => x.some((v) => y.includes(v));
  factor(
    "Индустрия",
    25,
    !!a?.industries?.length && !!profile.industries.length,
    overlap(a?.industries || [], profile.industries) ? 1 : 0,
    "Совпадает с вашими интересами",
    "Индустрия вне выбранных интересов",
  );
  const goalTypes = profile.goals.filter((g) =>
    ["saas", "service", "marketplace", "mobile"].includes(g),
  );
  const preferred = [...profile.businessTypes, ...goalTypes];
  factor(
    "Тип бизнеса / цель",
    20,
    !!a?.businessTypes?.length && !!preferred.length,
    overlap(a?.businessTypes || [], preferred) ? 1 : 0,
    "Тип бизнеса соответствует предпочтениям или цели",
    "Тип бизнеса вне выбранных предпочтений",
  );
  factor(
    "Целевой рынок",
    15,
    !!a?.markets?.length && !!profile.markets.length,
    overlap(a?.markets || [], profile.markets) ? 1 : 0,
    "Совпадает целевой рынок",
    "Целевой рынок отличается",
  );
  factor(
    "Команда",
    10,
    !!a?.teams?.length && !!profile.team,
    a?.teams?.includes(profile.team || "") ? 1 : 0,
    "Подходит выбранному составу команды",
    "Может потребоваться другой состав команды",
  );
  const budget = (
    { micro: 1000, small: 10000, medium: 100000, large: 100000 } as Record<
      string,
      number
    >
  )[profile.budget || ""];
  factor(
    "Бюджет",
    10,
    a?.minBudgetUsd !== undefined && !!profile.budget,
    (a?.minBudgetUsd ?? Infinity) <= budget ? 1 : 0,
    "Минимальный бюджет укладывается в выбранный диапазон",
    "Минимальный бюджет выше подтверждённого диапазона",
  );
  const hours = ({ part: 10, half: 20, full: 40 } as Record<string, number>)[
    profile.time || ""
  ];
  factor(
    "Время",
    10,
    a?.hoursPerWeek !== undefined && !!profile.time,
    (a?.hoursPerWeek ?? Infinity) <= hours ? 1 : 0,
    "Нагрузка укладывается в доступное время",
    "Может потребоваться больше времени",
  );
  const matched = (a?.skills || []).filter((s) =>
    profile.skills.includes(s),
  ).length;
  factor(
    "Навыки",
    10,
    !!a?.skills?.length && !!profile.skills.length,
    a?.skills?.length ? matched / a.skills.length : 0,
    `Использует ваши навыки: ${matched} из ${a?.skills?.length || 0}`,
    "Может потребовать навыки, которых в профиле нет",
  );
  if (a?.skills?.length && matched > 0 && matched < a.skills.length)
    reasons.push("Часть требуемых навыков отсутствует в профиле");
  return {
    score: total ? Math.round((100 * earned) / total) : null,
    coverage: total,
    reasons,
    unknown,
    limited: !profile.onboardingCompleted || total < 100,
    feedbackPenalty: dismissed ? 5 : 0,
  };
}
export function opportunityAttributes(
  raw: string | null,
  businessType: string | null,
): MatchAttributes | null {
  if (raw) {
    try {
      const p = attributeSchema.safeParse(JSON.parse(raw));
      if (p.success) return p.data;
    } catch {}
  }
  // Only the explicit existing generation enum is reused; no text keywords or invented budget/skills.
  return businessType &&
    ["saas", "service", "tool", "automation"].includes(businessType)
    ? {
        businessTypes: [businessType],
        basis: "Тип из сохранённой гипотезы; остальные факторы неизвестны",
      }
    : null;
}
export function personalRank(match: MatchResult) {
  return (match.score ?? -1) - match.feedbackPenalty;
}
