import { test } from "node:test";
import assert from "node:assert/strict";
import { deletionBlocked, passwordSchema, DELETE_CONFIRMATION } from "../lib/account.ts";

test("password rule is shared: 12 to 128 characters", () => {
  assert.equal(passwordSchema.safeParse("x".repeat(11)).success, false);
  assert.equal(passwordSchema.safeParse("x".repeat(12)).success, true);
  assert.equal(passwordSchema.safeParse("x".repeat(129)).success, false);
});

test("the last administrator cannot delete their account", () => {
  assert.equal(deletionBlocked(true, 1), true);
  assert.equal(deletionBlocked(true, 2), false);
  assert.equal(deletionBlocked(false, 1), false);
  assert.equal(DELETE_CONFIRMATION, "удалить");
});
