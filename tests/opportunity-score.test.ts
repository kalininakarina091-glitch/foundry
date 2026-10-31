import { test } from "node:test";
import assert from "node:assert/strict";
import { materialKindOf, scoreOpportunity, type ScoredSignal } from "../lib/opportunity-score.ts";

const now = new Date("2026-10-31T00:00:00Z");
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);
const s = (id: string, kind: string | null, published: Date | null, strength = 0.8): ScoredSignal => ({
  id,
  strength,
  materialKind: kind,
  publishedAt: published,
});
const evidence = { overall: 60, materials: 3, sources: 2 };
const dim = (r: ReturnType<typeof scoreOpportunity>, id: string) => r.dimensions.find((d) => d.id === id)!;

test("unknown dimensions are excluded and reported, never counted as zero", () => {
  const r = scoreOpportunity({
    signals: [s("1", null, null), s("2", null, null)],
    evidence,
    monetizationSignalIds: null,
    now,
  });
  assert.equal(dim(r, "demand").value, null);
  assert.equal(dim(r, "recency").value, null);
  assert.equal(dim(r, "monetization").value, null);
  assert.equal(r.coverage, 35);
  assert.equal(r.overall, 60);
  assert.match(dim(r, "monetization").basis, /Не оценивалась/);
});

test("demand, recency and stated spending raise the score with explicit bases", () => {
  const r = scoreOpportunity({
    signals: [s("1", "solution_request", daysAgo(10)), s("2", "own_problem", daysAgo(400)), s("3", "solution_request", daysAgo(20))],
    evidence,
    monetizationSignalIds: ["1", "3"],
    now,
  });
  assert.equal(r.coverage, 100);
  assert.equal(dim(r, "recency").value, 67);
  assert.equal(dim(r, "monetization").value, 100);
  assert.match(dim(r, "demand").basis, /2 из 3 авторов ищут решение/);
  // 0.35*60 + 0.25*demand + 0.15*67 + 0.25*100, demand = 0.4*2/3 + 0.6*0.8 = 75
  assert.equal(dim(r, "demand").value, 75);
  assert.equal(r.overall, Math.round(0.35 * 60 + 0.25 * 75 + 0.15 * 67 + 0.25 * 100));
});

test("spending cited outside the opportunity's signals is ignored; none cited stays unknown", () => {
  const signals = [s("1", "own_problem", daysAgo(5)), s("2", "own_problem", daysAgo(5))];
  const foreign = scoreOpportunity({ signals, evidence, monetizationSignalIds: ["x", "y"], now });
  assert.equal(dim(foreign, "monetization").value, null);
  const none = scoreOpportunity({ signals, evidence, monetizationSignalIds: [], now });
  assert.equal(dim(none, "monetization").value, null);
  assert.match(dim(none, "monetization").basis, /нет упоминаний/);
});

test("no traceable signals means no score", () => {
  const r = scoreOpportunity({ signals: [], evidence: { overall: 0, materials: 0, sources: 0 }, monetizationSignalIds: [], now });
  assert.equal(r.overall, 0);
  assert.equal(r.coverage, 0);
});

test("material kind is read from extraction metadata, preferring a later recheck", () => {
  assert.equal(materialKindOf(JSON.stringify({ extraction: { materialKind: "own_problem" } })), "own_problem");
  assert.equal(
    materialKindOf(JSON.stringify({ extraction: { materialKind: null, recheck: { materialKind: "solution_request" } } })),
    "solution_request",
  );
  assert.equal(materialKindOf("{"), null);
  assert.equal(materialKindOf(null), null);
});
