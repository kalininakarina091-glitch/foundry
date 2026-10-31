import { test } from "node:test";
import assert from "node:assert/strict";
import { nextActions } from "../lib/next-actions.ts";

const opps = [
  { id: "a", title: "Сверка заказов", score: 72, validated: false },
  { id: "b", title: "Жалобы клиентов", score: 55, validated: true },
  { id: "c", title: "Сад по фото", score: 64, validated: false },
];
const base = {
  opportunities: opps,
  decisions: {} as Record<string, string>,
  planned: new Set<string>(),
  dismissed: new Set<string>(),
  profileComplete: true,
  adminWarnings: null,
};
const hrefs = (x: Partial<typeof base>) => nextActions({ ...base, ...x }).map((a) => a.href);

test("an opportunity being worked on gets a plan, then a validation", () => {
  assert.deepEqual(hrefs({ decisions: { a: "exploring" } }).slice(0, 2), ["/plan/a", "/validation/a"]);
  assert.deepEqual(hrefs({ decisions: { a: "exploring" }, planned: new Set(["a"]) })[0], "/validation/a");
  // «Развиваю» comes before «Изучаю».
  assert.equal(hrefs({ decisions: { c: "exploring", b: "building" } })[0], "/plan/b");
});

test("the strongest undecided opportunity is suggested, skipping «Не для меня» and decided ones", () => {
  assert.ok(hrefs({}).includes("/opportunities/a"));
  assert.ok(hrefs({ dismissed: new Set(["a"]) }).includes("/opportunities/c"));
  assert.ok(hrefs({ decisions: { a: "rejected" } }).includes("/opportunities/c"));
});

test("profile, admin warnings and an empty catalog produce their own steps; at most four", () => {
  assert.ok(hrefs({ profileComplete: false }).includes("/settings/personalization"));
  assert.equal(hrefs({ adminWarnings: 2 })[0], "/signals");
  assert.ok(!hrefs({ adminWarnings: 0 }).includes("/signals"));
  assert.ok(hrefs({ opportunities: [] }).includes("/opportunities?view=all"));
  const many = nextActions({ ...base, decisions: { a: "building", b: "building", c: "exploring" }, profileComplete: false, adminWarnings: 1 });
  assert.equal(many.length, 4);
  assert.equal(new Set(many.map((a) => a.href)).size, 4);
});

test("decisions about unknown opportunities are ignored", () => {
  assert.ok(!hrefs({ decisions: { gone: "building" } }).some((h) => h.includes("gone")));
});
