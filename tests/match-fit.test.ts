import { test } from "node:test";
import assert from "node:assert/strict";
import { toMatchAttributes } from "../lib/match-fit.ts";
import { matchOpportunity, opportunityAttributes } from "../lib/personalization.ts";
import { emptyProfile } from "../lib/personal-profile.ts";
import { productTypeLabel } from "../lib/labels.ts";

test("only questionnaire option keys survive; unclear values stay unknown", () => {
  const attrs = toMatchAttributes(
    {
      industries: ["ecommerce", "space-mining", "ecommerce"],
      skills: ["development", "magic"],
      team: "solo",
      min_budget_usd: 500,
      hours_per_week: null,
      markets: null,
    },
    "tool",
  );
  assert.deepEqual(attrs.industries, ["ecommerce"]);
  assert.deepEqual(attrs.skills, ["development"]);
  assert.deepEqual(attrs.teams, ["solo", "cofounder", "team"]);
  assert.equal(attrs.minBudgetUsd, 500);
  assert.equal(attrs.hoursPerWeek, undefined);
  assert.equal(attrs.markets, undefined);
  assert.deepEqual(attrs.businessTypes, ["tool"]);
  assert.match(attrs.basis, /оценка модели/);
});

test("an unknown product type is not invented and a missing estimate adds nothing", () => {
  const attrs = toMatchAttributes(null, "Финтех");
  assert.deepEqual(Object.keys(attrs), ["basis"]);
});

test("estimated attributes raise profile coverage above the product type alone", () => {
  const profile = {
    ...emptyProfile,
    role: "developer" as const,
    goals: ["saas"],
    industries: ["ecommerce"],
    businessTypes: ["tool"],
    budget: "micro" as const,
    team: "solo" as const,
    time: "part" as const,
    skills: ["development"],
    markets: ["global"],
    onboardingCompleted: true,
  };
  const before = matchOpportunity(profile, opportunityAttributes(null, "tool"));
  const raw = JSON.stringify(
    toMatchAttributes(
      { industries: ["ecommerce"], skills: ["development"], team: "solo", min_budget_usd: 500, hours_per_week: 8 },
      "tool",
    ),
  );
  const after = matchOpportunity(profile, opportunityAttributes(raw, "tool"));
  assert.equal(before.coverage, 20);
  assert.ok(after.coverage > before.coverage);
  assert.equal(after.score, 100);
});

test("product type codes are shown in Russian; other categories as stored", () => {
  assert.equal(productTypeLabel("tool"), "Инструмент");
  assert.equal(productTypeLabel("SaaS"), "SaaS");
  assert.equal(productTypeLabel("Финтех"), "Финтех");
});
