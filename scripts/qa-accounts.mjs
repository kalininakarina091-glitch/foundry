/** Local integration QA only. Uses real HTTP, sessions and the supplied isolated database. */
import assert from "node:assert/strict";
import fs from "node:fs";
import { randomBytes, createHash } from "node:crypto";
const base = process.env.QA_BASE_URL;
if (
  !base ||
  !["localhost", "127.0.0.1"].includes(new URL(base).hostname) ||
  process.env.QA_ALLOW_MUTATIONS !== "1"
)
  throw new Error("Use an isolated localhost server and QA_ALLOW_MUTATIONS=1.");
const suffix = Date.now(),
  password = randomBytes(24).toString("base64url");
const accounts = [
  { email: `qa-a-${suffix}@example.test`, name: "QA Developer", cookie: "" },
  { email: `qa-b-${suffix}@example.test`, name: "QA Marketer", cookie: "" },
];
const checks = [];
async function api(
  path,
  method = "GET",
  body,
  account = null,
  expected = 200,
  origin = base,
) {
  const headers = { "Content-Type": "application/json", Origin: origin };
  if (account?.cookie) headers.Cookie = account.cookie;
  const r = await fetch(base + path, {
    method,
    headers,
    redirect: "manual",
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await r.json();
  assert.equal(
    r.status,
    expected,
    `${method} ${path}: ${JSON.stringify(data)}`,
  );
  const cookie = r.headers.get("set-cookie");
  if (cookie && account) account.cookie = cookie.split(";")[0];
  checks.push({ path, method, status: r.status });
  return { data, cookie };
}
await api("/api/me/profile", "GET", undefined, null, 401);
await api(
  "/api/me/saved",
  "PUT",
  { opportunityId: "x", active: true },
  null,
  401,
);
const [a, b] = accounts;
for (const account of accounts) {
  const result = await api(
    "/api/auth/register",
    "POST",
    { email: account.email, name: account.name, password },
    account,
    201,
  );
  assert.equal(result.data.next, "/welcome");
  assert.match(result.cookie, /HttpOnly/i);
  assert.match(result.cookie, /SameSite=lax/i);
  assert.ok(!result.cookie.includes(password));
}
await api(
  "/api/auth/login",
  "POST",
  { email: a.email, password: "wrong password" },
  null,
  401,
);
await api(
  "/api/auth/register",
  "POST",
  { email: "weak@example.test", name: "Weak", password: "short" },
  null,
  400,
);
const initial = (await api("/api/opportunities", "GET", undefined, a)).data;
const opportunity = initial.find((o) => o.industry === "tool");
assert.ok(opportunity, "Audit copy needs a real generated tool opportunity");
const initialFingerprint = createHash("sha256")
  .update(JSON.stringify(initial))
  .digest("hex");
let p = (await api("/api/me/profile", "GET", undefined, a)).data;
const changes = [
  { role: "developer" },
  { goals: ["first"], businessTypes: ["tool"] },
  { industries: ["ai"] },
  { budget: "micro", team: "solo", time: "part" },
  { skills: ["development"] },
  { markets: ["global"] },
];
for (let i = 0; i < 6; i++) {
  p = {
    ...p,
    ...changes[i],
    onboardingStep: Math.min(i + 1, 5),
    onboardingCompleted: i === 5,
  };
  await api("/api/me/profile", "PUT", p, a);
  assert.deepEqual(
    (await api("/api/me/profile", "GET", undefined, a)).data,
    p,
    "Draft survives a new request",
  );
}
const blankB = (await api("/api/me/profile", "GET", undefined, b)).data;
assert.equal(blankB.role, null);
await api("/api/me/profile", "PUT", { ...blankB, onboardingSkipped: true }, b);
assert.equal(
  (await api("/api/me/catalog", "GET", undefined, b)).data.limited,
  true,
);
const pb = {
  ...p,
  role: "marketer",
  goals: ["service"],
  businessTypes: ["service"],
  industries: ["marketing"],
  skills: ["marketing"],
};
await api("/api/me/profile", "PUT", pb, b);
assert.deepEqual(
  (await api("/api/me/profile?userId=other", "GET", undefined, a)).data,
  p,
);
await api("/api/me/profile", "PUT", { ...p, userId: "another-user" }, a, 400);
await api("/api/me/profile", "PUT", p, a, 403, "https://evil.test");
await api(
  "/api/source",
  "POST",
  { name: "unauthorized", type: "rss", url: "https://techcrunch.com/feed/" },
  a,
  403,
);
await api(
  "/api/me/saved",
  "PUT",
  { opportunityId: opportunity.id, active: true },
  a,
);
await api(
  "/api/me/feedback",
  "PUT",
  { opportunityId: opportunity.id, active: true },
  a,
);
assert.deepEqual((await api("/api/me/saved", "GET", undefined, b)).data, []);
assert.deepEqual((await api("/api/me/feedback", "GET", undefined, b)).data, []);
await api(
  "/api/me/saved",
  "PUT",
  { opportunityId: opportunity.id, active: true, userId: "other" },
  a,
  400,
);
const ca = (await api("/api/me/catalog", "GET", undefined, a)).data,
  cb = (await api("/api/me/catalog", "GET", undefined, b)).data;
assert.equal(ca.matches[opportunity.id].score, 100);
assert.equal(cb.matches[opportunity.id].score, 0);
assert.equal(ca.matches[opportunity.id].coverage, 20);
assert.equal(ca.matches[opportunity.id].feedbackPenalty, 5);
assert.equal(cb.matches[opportunity.id].feedbackPenalty, 0);
assert.deepEqual(
  (await api("/api/opportunities", "GET", undefined, b)).data,
  initial,
  "Shared catalog must be identical",
);
await api(
  "/api/me/preferences",
  "PATCH",
  { name: "Updated Developer", compact: true },
  a,
);
assert.equal(
  (await api("/api/me/preferences", "GET", undefined, b)).data.compact,
  false,
);
assert.equal(
  (await api("/api/me/preferences", "GET", undefined, a)).data.name,
  "Updated Developer",
);
const changed = { ...p, industries: ["education"] };
await api("/api/me/profile", "PUT", changed, a);
assert.deepEqual(
  (await api("/api/me/profile", "GET", undefined, a)).data,
  changed,
);
const old = { cookie: a.cookie };
await api("/api/auth/logout", "POST", {}, a);
await api("/api/me/profile", "GET", undefined, old, 401);
await api(
  "/api/auth/login",
  "POST",
  { email: a.email.toUpperCase(), password },
  a,
);
assert.notEqual(a.cookie, old.cookie);
assert.deepEqual(
  (await api("/api/me/profile", "GET", undefined, a)).data,
  changed,
);
assert.equal((await api("/api/me/saved", "GET", undefined, a)).data.length, 1);
await api(
  "/api/me/feedback",
  "PUT",
  { opportunityId: opportunity.id, active: false },
  a,
);
assert.equal(
  (await api("/api/me/catalog", "GET", undefined, a)).data.matches[
    opportunity.id
  ].score,
  100,
);
assert.equal(
  createHash("sha256")
    .update(
      JSON.stringify(
        (await api("/api/opportunities", "GET", undefined, a)).data,
      ),
    )
    .digest("hex"),
  initialFingerprint,
);
for (const path of [
  "/welcome",
  "/onboarding",
  "/profile-ready",
  "/settings/personalization",
  "/opportunities?view=for-you",
  "/opportunities?view=all",
]) {
  const r = await fetch(base + path, { headers: { Cookie: a.cookie } });
  assert.equal(r.status, 200, path);
  assert.ok(!(await r.text()).includes("Application error:"));
  checks.push({ path, status: r.status });
}
await api(
  "/api/me/profile",
  "GET",
  undefined,
  { cookie: "foundry_session=" + randomBytes(32).toString("base64url") },
  401,
);
// Ensure a second login revokes the previous session cookie.
const rotated = { cookie: a.cookie };
await api("/api/auth/login", "POST", { email: a.email, password }, a);
await api("/api/me/profile", "GET", undefined, rotated, 401);
const report = {
  ranAt: new Date().toISOString(),
  passed: checks.length,
  opportunityId: opportunity.id,
  marketScore: opportunity.score,
  matchA: ca.matches[opportunity.id],
  matchB: cb.matches[opportunity.id],
  marketFingerprint: initialFingerprint,
  checks,
};
if (process.env.QA_REPORT_PATH)
  fs.writeFileSync(process.env.QA_REPORT_PATH, JSON.stringify(report, null, 2));
// Optional private local handoff for browser QA; never commit this file or print secrets.
if (process.env.QA_CREDENTIALS_PATH)
  fs.writeFileSync(
    process.env.QA_CREDENTIALS_PATH,
    JSON.stringify({
      email: a.email,
      password,
      cookie: a.cookie,
      otherEmail: b.email,
    }),
  );
console.log(
  JSON.stringify({
    passed: checks.length,
    opportunityId: opportunity.id,
    score: opportunity.score,
    matchA: ca.matches[opportunity.id].score,
    matchB: cb.matches[opportunity.id].score,
    isolated: true,
  }),
);
