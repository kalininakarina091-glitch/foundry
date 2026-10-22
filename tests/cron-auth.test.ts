import { test } from "node:test";
import assert from "node:assert/strict";
import { cronAuthorization } from "../lib/cron-auth.ts";

const secret = "s".repeat(40);

test("the scheduled pipeline endpoint fails closed without a strong secret", () => {
  assert.equal(cronAuthorization(`Bearer ${secret}`, undefined), "missing");
  assert.equal(cronAuthorization("Bearer short", "short"), "missing");
});

test("only the exact bearer secret is accepted", () => {
  assert.equal(cronAuthorization(`Bearer ${secret}`, secret), "ok");
  assert.equal(cronAuthorization(secret, secret), "denied");
  assert.equal(cronAuthorization(`Bearer ${secret}x`, secret), "denied");
  assert.equal(cronAuthorization(null, secret), "denied");
  assert.equal(cronAuthorization("", secret), "denied");
});
