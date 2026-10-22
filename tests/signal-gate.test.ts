import { test } from "node:test";
import assert from "node:assert/strict";
import { acceptSignal } from "../lib/signal-gate.ts";

const base = {
  is_relevant: true,
  pain_point: "Тратит 6 часов в неделю на сверку заказов",
  customer: "Владельцы небольших пекарен",
};

test("a person's own problem or a request for a solution can become a signal", () => {
  assert.equal(acceptSignal({ ...base, material_kind: "own_problem" as const }).is_relevant, true);
  assert.equal(acceptSignal({ ...base, material_kind: "solution_request" as const }).is_relevant, true);
  assert.equal(
    acceptSignal({ ...base, customer: null, material_kind: "own_problem" as const }).is_relevant,
    true,
  );
});

test("bug reports, news, launches and opinions never become demand signals", () => {
  for (const kind of ["bug_report", "news", "product_launch", "opinion", "other"] as const) {
    const result = acceptSignal({ ...base, material_kind: kind });
    assert.equal(result.is_relevant, false, kind);
    assert.equal(result.rejected, "not_a_need");
  }
});

test("a relevant answer without classification or without pain and customer is rejected", () => {
  assert.equal(acceptSignal({ ...base }).rejected, "kind_missing");
  const empty = acceptSignal({ ...base, pain_point: " ", customer: null, material_kind: "own_problem" as const });
  assert.equal(empty.is_relevant, false);
  assert.equal(empty.rejected, "no_pain_or_customer");
});

test("an irrelevant answer is passed through unchanged", () => {
  const irrelevant = { ...base, is_relevant: false, material_kind: "news" as const };
  assert.deepEqual(acceptSignal(irrelevant), irrelevant);
});
