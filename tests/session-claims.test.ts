import { test } from "node:test";
import assert from "node:assert/strict";
import { claimsSecret, signClaims, verifyClaims, CLAIMS_TTL_MS } from "../lib/session-claims.ts";

const secret = "s".repeat(40);
const token = "A".repeat(43);
const now = 1_800_000_000_000;

test("a signed hint round-trips the admin flag for its own token", async () => {
  assert.deepEqual(await verifyClaims(await signClaims(token, true, secret, now), token, secret, now), { admin: true });
  assert.deepEqual(await verifyClaims(await signClaims(token, false, secret, now), token, secret, now), { admin: false });
});

test("expired, foreign-token, wrong-secret and tampered hints are rejected", async () => {
  const value = await signClaims(token, false, secret, now);
  assert.equal(await verifyClaims(value, token, secret, now + CLAIMS_TTL_MS + 1), null);
  assert.equal(await verifyClaims(value, "B".repeat(43), secret, now), null);
  assert.equal(await verifyClaims(value, token, "t".repeat(40), now), null);
  // Flip the admin bit in the payload while keeping the old signature.
  const [payload, signature] = value.split(".");
  const forged = Buffer.from(
    JSON.stringify({ ...JSON.parse(Buffer.from(payload, "base64url").toString()), a: 1 }),
  ).toString("base64url");
  assert.equal(await verifyClaims(`${forged}.${signature}`, token, secret, now), null);
  for (const bad of [undefined, "", "x", "a.b.c", `${payload}.`, "x".repeat(600)])
    assert.equal(await verifyClaims(bad, token, secret, now), null);
});

test("hints are disabled without a strong secret", () => {
  assert.equal(claimsSecret(undefined), null);
  assert.equal(claimsSecret("short"), null);
  assert.equal(claimsSecret(secret), secret);
});
