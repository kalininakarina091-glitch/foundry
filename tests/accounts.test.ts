import { test } from "node:test";
import assert from "node:assert/strict";
import { configuredAppOrigin } from "../lib/app-origin.ts";
import { isNetlifyDeployment } from "../lib/deployment.ts";
import {
  hashPassword,
  verifyPassword,
  newToken,
  tokenDigest,
  sameOrigin,
} from "../lib/auth-crypto.ts";
import {
  emptyProfile,
  profileSchema,
  completeProfile,
} from "../lib/personal-profile.ts";
import {
  matchOpportunity,
  opportunityAttributes,
  personalRank,
} from "../lib/personalization.ts";
test("deployment origin uses public Netlify metadata and still rejects cross-origin mutations", () => {
  const before = { app: process.env.APP_ORIGIN, deploy: process.env.FOUNDRY_DEPLOY_ORIGIN };
  try {
    delete process.env.APP_ORIGIN;
    process.env.FOUNDRY_DEPLOY_ORIGIN = "https://deploy-preview-5--foundry.netlify.app";
    assert.equal(configuredAppOrigin(), process.env.FOUNDRY_DEPLOY_ORIGIN);
    assert.equal(sameOrigin(new Request("https://internal-function/api/auth/login", {
      headers: { Origin: process.env.FOUNDRY_DEPLOY_ORIGIN },
    })), true);
    assert.equal(sameOrigin(new Request("https://internal-function/api/auth/login", {
      headers: { Origin: "https://evil.test" },
    })), false);
    process.env.APP_ORIGIN = "https://configured.example";
    assert.equal(configuredAppOrigin(), process.env.APP_ORIGIN);
  } finally {
    if (before.app === undefined) delete process.env.APP_ORIGIN;
    else process.env.APP_ORIGIN = before.app;
    if (before.deploy === undefined) delete process.env.FOUNDRY_DEPLOY_ORIGIN;
    else process.env.FOUNDRY_DEPLOY_ORIGIN = before.deploy;
  }
});
test("Netlify runtime is explicit and does not use the local SQLite account store", () => {
  const before = process.env.FOUNDRY_PLATFORM;
  try {
    process.env.FOUNDRY_PLATFORM = "netlify";
    assert.equal(isNetlifyDeployment(), true);
    process.env.FOUNDRY_PLATFORM = "local";
    assert.equal(isNetlifyDeployment(), false);
  } finally {
    if (before === undefined) delete process.env.FOUNDRY_PLATFORM;
    else process.env.FOUNDRY_PLATFORM = before;
  }
});
test("password hashes use salts, reject wrong secrets and do not contain plaintext", async () => {
  const password = "correct horse battery staple";
  const a = await hashPassword(password),
    b = await hashPassword(password);
  assert.notEqual(a, b);
  assert.ok(!a.includes(password));
  assert.equal(await verifyPassword(password, a), true);
  assert.equal(await verifyPassword("different password", a), false);
  assert.equal(await verifyPassword(password, "malformed"), false);
});
test("session tokens have 256 random bits; only hashes identify database sessions", () => {
  const a = newToken(),
    b = newToken();
  assert.equal(a.length, 43);
  assert.notEqual(a, b);
  assert.equal(tokenDigest(a).length, 64);
  assert.notEqual(tokenDigest(a), a);
});
test("mutation origin check rejects missing and cross-site origins", () => {
  assert.equal(
    sameOrigin(
      new Request("http://localhost:3100/api/me", {
        headers: { origin: "http://localhost:3100" },
      }),
    ),
    true,
  );
  assert.equal(
    sameOrigin(
      new Request("http://localhost:3100/api/me", {
        headers: { origin: "https://evil.test" },
      }),
    ),
    false,
  );
  assert.equal(sameOrigin(new Request("http://localhost:3100/api/me")), false);
});
test("profile rejects ownership/admin fields and incomplete completion is detected", () => {
  assert.equal(
    profileSchema.safeParse({ ...emptyProfile, userId: "other" }).success,
    false,
  );
  assert.equal(
    profileSchema.safeParse({ ...emptyProfile, isAdmin: true }).success,
    false,
  );
  assert.equal(completeProfile(emptyProfile), false);
  assert.equal(
    profileSchema.safeParse({ ...emptyProfile, industries: ["made-up"] })
      .success,
    false,
  );
});
test("unknown opportunity factors remain unknown instead of invented fit", () => {
  const result = matchOpportunity(emptyProfile, null);
  assert.equal(result.score, null);
  assert.equal(result.coverage, 0);
  assert.equal(result.unknown.length, 7);
  assert.equal(opportunityAttributes(null, "Здравоохранение"), null);
});
test("same opportunity has different explainable personal scores without mutating market data", () => {
  const opportunity = {
    score: 42,
    validationConfidence: 0,
    attributes: { businessTypes: ["tool"], basis: "stored enum" },
  };
  const snapshot = JSON.stringify(opportunity);
  const a = matchOpportunity(
      { ...emptyProfile, businessTypes: ["tool"] },
      opportunity.attributes,
    ),
    b = matchOpportunity(
      { ...emptyProfile, businessTypes: ["service"] },
      opportunity.attributes,
    );
  assert.equal(a.score, 100);
  assert.equal(b.score, 0);
  assert.equal(a.coverage, 20);
  assert.equal(a.unknown.length, 6);
  assert.equal(JSON.stringify(opportunity), snapshot);
  assert.equal(
    matchOpportunity(
      { ...emptyProfile, businessTypes: ["tool"] },
      opportunity.attributes,
      true,
    ).score,
    a.score,
  );
  assert.equal(personalRank({ ...a, feedbackPenalty: 5 }), 95);
});
test("structured resource and skills factors expose mismatches and partial coverage", () => {
  const p = {
    ...emptyProfile,
    budget: "micro",
    team: "solo",
    time: "part",
    skills: ["development"],
    markets: ["europe"],
    industries: ["ai"],
    businessTypes: ["tool"],
    onboardingCompleted: true,
  };
  const a = {
    industries: ["ai"],
    businessTypes: ["tool"],
    markets: ["us"],
    teams: ["team"],
    minBudgetUsd: 5000,
    hoursPerWeek: 30,
    skills: ["development", "sales"],
    basis: "verified attributes",
  };
  const r = matchOpportunity(p, a);
  assert.equal(r.coverage, 100);
  assert.equal(r.score, 50);
  assert.ok(r.reasons.some((s) => s.includes("отсутствует")));
});
