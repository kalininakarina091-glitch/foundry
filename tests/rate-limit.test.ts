import { test } from "node:test";
import assert from "node:assert/strict";
import { clientIp, limitKey } from "../lib/client-ip.ts";

const request = (headers: Record<string, string>) =>
  new Request("https://foundry.test/api/auth/login", { headers });

test("Netlify's client IP header wins over client-supplied forwarding headers", () => {
  assert.equal(
    clientIp(request({ "x-nf-client-connection-ip": "203.0.113.7", "x-forwarded-for": "198.51.100.1" })),
    "203.0.113.7",
  );
  assert.equal(clientIp(request({ "x-forwarded-for": "198.51.100.1, 10.0.0.1" })), "198.51.100.1");
  assert.equal(clientIp(request({ "x-real-ip": "2001:DB8::1" })), "2001:db8::1");
  assert.equal(clientIp(request({})), "unknown");
});

test("limits are scoped per address and per account, never site-wide", () => {
  const a = limitKey("login-ip", "203.0.113.7"),
    b = limitKey("login-ip", "203.0.113.8");
  assert.notEqual(a, b);
  assert.notEqual(limitKey("login-ip", "x"), limitKey("register-ip", "x"));
  assert.notEqual(limitKey("login-email", "a@b.c"), limitKey("validate-user", "a@b.c"));
  assert.equal(a, limitKey("login-ip", "203.0.113.7"));
});

test("rate-limit keys never contain raw IP addresses or emails", () => {
  const key = limitKey("login-email", "person@example.com");
  assert.match(key, /^login-email-[0-9a-f]{32}$/);
  assert.ok(!key.includes("person"));
  assert.ok(!limitKey("login-ip", "203.0.113.7").includes("203.0"));
});
