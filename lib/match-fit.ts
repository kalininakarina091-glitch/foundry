import { z } from "zod";
import { industries, markets, skills } from "./personal-profile.ts";
import type { MatchAttributes } from "./personalization.ts";
// What it takes to build a first version, as estimated by the generating
// model. Only option keys from the profile questionnaire are kept, so the
// Match Score compares like with like; anything unclear stays unknown.
export const fitSchema = z
  .object({
    industries: z.array(z.string()).nullable(),
    skills: z.array(z.string()).nullable(),
    team: z.enum(["solo", "cofounder", "team"]).nullable(),
    min_budget_usd: z.number().nonnegative().max(10_000_000).nullable(),
    hours_per_week: z.number().positive().max(80).nullable(),
    markets: z.array(z.string()).nullable(),
  })
  .partial();
export type Fit = z.infer<typeof fitSchema>;
export const FIT_PROMPT = `fit (estimate what one founder needs for a first version, null for anything unclear): industries (up to 3 of: ${Object.keys(industries).join("|")}), skills (up to 5 of: ${Object.keys(skills).join("|")}, needed to build and sell a first version), team (solo|cofounder|team: the smallest team that can build it), min_budget_usd (rough minimum cash for a first version), hours_per_week (rough weekly hours for one person over ~3 months), markets (only if the sources state a geography: ${Object.keys(markets).join("|")}; otherwise null)`;
const PRODUCT_TYPES = ["saas", "service", "tool", "automation"];
// A solo-sized project also fits larger teams; a team-sized one does not fit a solo founder.
const TEAMS_FOR: Record<string, string[]> = {
  solo: ["solo", "cofounder", "team"],
  cofounder: ["cofounder", "team"],
  team: ["team"],
};
const known = (values: string[] | null | undefined, options: object, max: number) =>
  [...new Set((values || []).filter((v) => Object.hasOwn(options, v)))].slice(0, max);
export function toMatchAttributes(
  fit: Fit | null | undefined,
  productType: string | null,
): MatchAttributes {
  const attrs: MatchAttributes = {
    ...(productType && PRODUCT_TYPES.includes(productType)
      ? { businessTypes: [productType] }
      : {}),
    basis:
      "Тип продукта из гипотезы; отрасль, навыки, команда, бюджет и время — оценка модели для первой версии, не подтверждена рынком",
  };
  const ind = known(fit?.industries, industries, 3);
  const sk = known(fit?.skills, skills, 5);
  const mk = known(fit?.markets, markets, 5);
  if (ind.length) attrs.industries = ind;
  if (sk.length) attrs.skills = sk;
  if (mk.length) attrs.markets = mk;
  if (fit?.team) attrs.teams = TEAMS_FOR[fit.team];
  if (typeof fit?.min_budget_usd === "number") attrs.minBudgetUsd = fit.min_budget_usd;
  if (typeof fit?.hours_per_week === "number") attrs.hoursPerWeek = fit.hours_per_week;
  return attrs;
}
