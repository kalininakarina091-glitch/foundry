import { test } from "node:test";
import assert from "node:assert/strict";
import { decisionLabel, decisionSchema, isEmptyDecision, NOTE_MAX } from "../lib/decisions.ts";

test("only known statuses or none are accepted; notes are trimmed and bounded", () => {
  assert.equal(decisionSchema.safeParse({ opportunityId: "o1", status: "building", note: "  да  " }).data?.note, "да");
  assert.equal(decisionSchema.safeParse({ opportunityId: "o1", status: null, note: "" }).success, true);
  assert.equal(decisionSchema.safeParse({ opportunityId: "o1", status: "won", note: "" }).success, false);
  assert.equal(decisionSchema.safeParse({ opportunityId: "o1", status: null, note: "x".repeat(NOTE_MAX + 1) }).success, false);
  // Ownership comes from the session, never from the request body.
  assert.equal(decisionSchema.safeParse({ opportunityId: "o1", status: null, note: "", userId: "u2" }).success, false);
});

test("a decision without status and note is removed; labels are Russian", () => {
  assert.equal(isEmptyDecision({ status: null, note: "   " }), true);
  assert.equal(isEmptyDecision({ status: null, note: "почему нет" }), false);
  assert.equal(decisionLabel("exploring"), "Изучаю");
  assert.equal(decisionLabel("rejected"), "Отказ");
  assert.equal(decisionLabel("__proto__"), null);
  assert.equal(decisionLabel(null), null);
});
