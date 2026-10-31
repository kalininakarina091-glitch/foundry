import { test } from "node:test";
import assert from "node:assert/strict";
import { checkPlan, placesFromEvidence, planPrompt, type PlanEvidence } from "../lib/business-plan.ts";

const plan = {
  summary: "Проверяем, готовы ли владельцы магазинов платить за сверку заказов.",
  assumptions: [{ text: "Сверка занимает часы", why_risky: "Может быть разовой проблемой", evidence_ids: ["e1", "foreign", "e1"] }],
  interview: { who: "Владельцы небольших магазинов", questions: ["Как вы сверяете заказы сейчас?", "Сколько времени это занимает?", "Что пробовали?"] },
  demand_test: { method: "concierge", description: "Сверять вручную для 3 магазинов", success_criteria: "2 из 3 просят продолжить", duration_days: 14, cost_estimate: null },
  mvp: { core_job: "Свести заказы в одну таблицу", include: ["Импорт CSV"], exclude: ["Мобильное приложение"] },
  next_steps: ["Написать 10 авторам сигналов"],
  unknowns: ["Сколько магазинов готовы платить"],
};
const evidence: PlanEvidence[] = [
  { id: "e1", claim: "Тратит 6 часов", quote: "spend 6 hours", source: "Ask HN", url: "https://news.ycombinator.com/item?id=1" },
  { id: "e2", claim: "Ищет инструмент", quote: "is there a tool", source: "Ask HN", url: "https://news.ycombinator.com/item?id=2" },
  { id: "e3", claim: "Ручная сверка", quote: "by hand", source: "Reddit r/smallbusiness", url: "https://www.reddit.com/r/smallbusiness/comments/3" },
];

test("references outside the opportunity's evidence are dropped", () => {
  assert.deepEqual(checkPlan(plan, ["e1", "e2"]).assumptions[0].evidence_ids, ["e1"]);
});

test("malformed plans are rejected", () => {
  assert.throws(() => checkPlan({ ...plan, demand_test: { ...plan.demand_test, method: "ads" } }, []));
  assert.throws(() => checkPlan({ ...plan, interview: { ...plan.interview, questions: ["одна"] } }, []));
  assert.throws(() => checkPlan({ ...plan, assumptions: [] }, []));
});

test("where to find people comes from the actual sources, not from the model", () => {
  const places = placesFromEvidence(evidence);
  assert.deepEqual(places.map((p) => p.source), ["Ask HN", "Reddit r/smallbusiness"]);
  assert.equal(places[0].examples.length, 2);
});

test("the prompt carries the founder's resources and no source links", () => {
  const prompt = planPrompt({
    title: "Сверка заказов",
    problem: "Ручная сверка",
    customer: null,
    evidence,
    validation: null,
    founder: { skills: ["Разработка"], budget: "$0–$1K", time: "Частично · 5–10 ч/нед", team: "Один основатель" },
  });
  assert.match(prompt, /\$0–\$1K/);
  assert.match(prompt, /не спрашивай «купили бы вы»/);
  assert.doesNotMatch(prompt, /news\.ycombinator\.com/);
});
