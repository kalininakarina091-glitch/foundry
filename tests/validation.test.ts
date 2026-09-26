import { test } from "node:test";
import assert from "node:assert/strict";
import {
  checkValidationReport,
  hasEnoughEvidence,
  insufficientReport,
  type ValidationEvidence,
} from "../lib/validation.ts";
import { safeSourceUrl, opportunityHref } from "../lib/opportunity-types.ts";
const evidence: ValidationEvidence[] = [0, 1, 2].map((i) => ({
  id: `e${i}`,
  claim: "Наблюдение из материала",
  sourceId: `s${i % 2}`,
  rawItemId: `r${i}`,
  url: `https://example.org/${i}`,
  type: "neutral",
  signalType: "pain",
}));
const validReport = {
  ...insufficientReport(),
  verdict: "promising",
  confidence: 80,
  recommendation: "BUILD",
  positive_evidence: [
    { claim: "Повторяющаяся проблема", evidence_ids: ["e0", "e1"] },
  ],
};

test("missing, single-source or duplicate materials cannot justify BUILD", () => {
  assert.equal(hasEnoughEvidence([]), false);
  assert.equal(
    hasEnoughEvidence(evidence.map((e) => ({ ...e, sourceId: "same" }))),
    false,
  );
  assert.equal(
    hasEnoughEvidence(evidence.map((e) => ({ ...e, rawItemId: "same" }))),
    false,
  );
  assert.equal(
    hasEnoughEvidence(evidence.map((e) => ({ ...e, url: null }))),
    false,
  );
  assert.equal(
    checkValidationReport(validReport, evidence.slice(0, 2)).recommendation,
    "RESEARCH MORE",
  );
});
test("valid referenced report is accepted without turning Score into a verdict", () => {
  assert.equal(hasEnoughEvidence(evidence), true);
  assert.equal(
    checkValidationReport(validReport, evidence).recommendation,
    "BUILD",
  );
  assert.equal(
    checkValidationReport({ ...validReport, confidence: 40 }, evidence)
      .recommendation,
    "RESEARCH MORE",
  );
  assert.equal(
    checkValidationReport({ ...validReport, positive_evidence: [] }, evidence)
      .recommendation,
    "RESEARCH MORE",
  );
});
test("invented references and malformed model output are rejected", () => {
  assert.throws(() =>
    checkValidationReport(
      {
        ...validReport,
        positive_evidence: [{ claim: "Invented", evidence_ids: ["missing"] }],
      },
      evidence,
    ),
  );
  assert.throws(() =>
    checkValidationReport({ ...validReport, confidence: 101 }, evidence),
  );
  assert.throws(() =>
    checkValidationReport({ recommendation: "BUILD" }, evidence),
  );
});
test("demo links preserve mode and source links permit only HTTP(S)", () => {
  assert.equal(
    opportunityHref({ id: "1", demo: true }),
    "/opportunities/1?mode=demo",
  );
  assert.equal(
    opportunityHref({ id: "real", demo: false }),
    "/opportunities/real",
  );
  assert.equal(safeSourceUrl("javascript:alert(1)"), null);
  assert.equal(safeSourceUrl("/relative"), null);
  assert.equal(
    safeSourceUrl("https://example.org/item"),
    "https://example.org/item",
  );
});
