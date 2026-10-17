# Accounts and personalization: architecture and final QA

Final verification: 2026-10-03. Branch: `feat/accounts-personalization`, based on the full pipeline audit in PR #4. The PR to main includes the unmerged predecessor changes. No merge into main is performed.

## What changed

The earlier login/signup screens and browser-local preferences/bookmarks did not establish an account or isolate users. They are now backed by a User, UserProfile, opaque server sessions and per-user Saved/Feedback records. The public landing page leads to registration, welcome, six onboarding steps, profile-ready and the personalized catalog. Settings edits the same server profile. Demo opportunities cannot be saved as real account data.

The six steps collect role; goals and optional business types; industries; budget/team/time; skills; markets. Next and Back persist answers and the step. Skip persists a partial profile with an explicit limited-personalization state. Settings can edit every field or restart the wizard. A final browser regression found that `restart=1` remained in the address after saving, causing reload to restart again. Saving now removes that one-time parameter so reload resumes the stored step.

## Auth architecture

- Node native asynchronous scrypt uses N=32768, r=8, p=3, a random 16-byte salt and a 64-byte derived hash. Passwords are 12–128 characters on registration; verification uses constant-time comparison. No password is stored or returned in plaintext. The encoded format is versioned for future upgrades. Derivation concurrency is capped at two per process.
- Sessions use random 256-bit opaque tokens. SQLite stores SHA-256 token hashes, user ownership and seven-day expiry. Cookies are HttpOnly, SameSite=Lax, Path=/ and Secure for an HTTPS canonical origin. Login rotates the current browser session; logout revokes it in the database and performs a full navigation to discard account UI state. Other devices remain signed in.
- Next.js `proxy.ts` protects pages and APIs, rejects cross-origin/missing-Origin mutations and requires APP_ORIGIN outside localhost. Profile endpoints also resolve the user from the server session and use strict payload schemas. Body/query user IDs cannot select another account. Private responses are marked no-store.
- Shared market mutation endpoints require `isAdmin`; regular users can read the common catalog and request existing Validation. Signup cannot assign admin privileges. Account UI uses a safe user DTO, not password/session records.
- Persisted throttles limit validly shaped auth attempts to 10 per email and 60 globally per 15-minute window. Unknown-account login still performs a dummy password derivation. Duplicate registration returns a conflict, so email existence is not completely concealed.

This is a small application-owned credentials/session layer, not a managed identity provider. Cryptographic primitives come from [Node crypto](https://nodejs.org/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback); scrypt parameters follow the corresponding option in [OWASP password storage guidance](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html). No new auth package, OAuth adapter or email service is introduced.

## Additive schema

| Model | Ownership / purpose |
| --- | --- |
| User | Unique normalized email, passwordHash, name, isAdmin=false |
| UserProfile | One-to-one userId; role, goals, industries, businessTypes, budget, team, time, skills, markets, onboarding flags/step, UI preferences/about |
| Session | tokenHash primary key, userId, expiresAt; user/expiry indexes |
| SavedOpportunity | Composite primary key (userId, opportunityId) |
| OpportunityFeedback | Same composite key; `not_for_me` action |
| AuthThrottle | Hashed email/global key, attempts and window expiry |
| Opportunity.matchAttributes | Optional JSON with structured match factors and a required basis description |

SQLite JSON strings are validated at the application boundary. Foreign keys tie personal records to their owners. Migration `20260927000200_accounts` only adds tables, indexes and the optional opportunity column; it does not rewrite market records. Existing unowned browser-local data is not silently assigned to the next person who registers.

## Three separate scores

`Market pipeline → Opportunity → evidence support Score / Validation` remains independent of `UserProfile + opportunity attributes + own feedback → personalization`.

Match Score = round(100 × sum(known factor weight × fit) / sum(known factor weight)). Unknown factors are excluded, named in the explanation, and lower the displayed coverage. With no known factors the score is null, displayed as a dash. A score of 100 at 20% coverage means a match on a single known dimension, not 100% overall suitability.

| Factor | Weight | Rule |
| --- | ---: | --- |
| Industry | 25 | Any overlap with interests |
| Business type / concrete goal | 20 | Any overlap with preferred types or SaaS/service/marketplace/mobile goals |
| Market | 15 | Any overlap |
| Team | 10 | Selected team in supported team types |
| Budget | 10 | Minimum budget fits the selected bracket ceiling |
| Time | 10 | Required hours fit the selected time allowance |
| Skills | 10 | Fraction of required skills in the profile |

Budget ceilings are $1K/$10K/$100K/$100K (last bracket conservative); time allowances are 10/20/40 hours. These are transparent MVP assumptions, not verified feasibility. Role and broad goals remain profile information rather than invented capability signals.

Only explicit structured attributes are used. When absent, the existing generation enum `saas/service/tool/automation` can supply business type. There is no keyword-to-domain inference and no invented budget, skills or market. Most existing records therefore have 0–20% coverage. The stored generated business type is itself a hypothesis, not validated evidence. No enrichment endpoint or new generation pipeline is added.

«Не для меня» subtracts five points from the user's sort rank only. It does not modify the displayed Match Score or shared records. «Все возможности» does not use the profile or feedback for ranking; user-selected presentation filters can still differ. Match results are computed on request, not written into Opportunity.score or Validation.

## Verification

All checks use the final production build and a disposable copy of the real-data audit database. Source project databases were not migrated or reset.

- Lint: pass, no warnings. Typecheck: pass. All 18 unit tests: pass (7 accounts/personalization and 11 pipeline tests). Production webpack build: pass, including server routes and Proxy.
- Desktop-compatible commands: `node node_modules/eslint/bin/eslint.js .`; `node node_modules/typescript/bin/tsc --noEmit`; `node --experimental-strip-types --test --test-isolation=none tests/*.test.ts`; `FOUNDRY_AUDIT_BUILD=1 FOUNDRY_BUILD_THREADS=1 node node_modules/next/dist/bin/next build --webpack`. Thread mode still performs TypeScript validation.
- Actual Prisma migrate deploy on a fresh copy passed. Full before/after market rows were equal: 8 Source, 191 RawItem, 44 Signal, 7 Opportunity, 83 Evidence. SQLite integrity check passed; no foreign-key violations.
- `scripts/qa-accounts.mjs`: 58 HTTP checks passed, including real registration, invalid login/password policy, six server-persisted steps, skip, profile editing, two users, ownership spoofing rejection, cross-origin rejection, regular-user market-write rejection, Saved/Feedback isolation, logout revocation, re-login persistence, forged token rejection and login rotation.
- Same real opportunity: Opportunity Score 42 for both users; Match Score 100 for tool preference versus 0 for service preference, both at 20% coverage. Common catalog responses are identical for A/B and unchanged across personalization mutations (SHA-256 snapshot comparison).
- `scripts/qa-pipeline.mjs`: 44 checks passed with a temporarily privileged QA user on the copy. Normalization, extraction/generation idempotency, provenance, score clear/restore and Validation guards remain functional. Two real materials from one publication host produce RESEARCH MORE, not BUILD. The QA role is revoked afterward.
- Additional real HTTP/DB checks confirmed salted password hashes, hashed session storage, expired-session rejection and 429 on the eleventh email-scoped login attempt. These checks do not constitute a penetration test.
- Browser QA covers real login, six-step completion, reload/resume, Settings save/reload, For you/All tabs, Saved/Feedback and logout. Browser test identities exist only on the QA copy.

Safe machine-readable results are in `docs/qa/`. Session cookies, generated test passwords, database files and `.env.local` remain outside version control.

Repeat account QA on a localhost production server pointed at an isolated audit DB with `QA_BASE_URL`, `QA_ALLOW_MUTATIONS=1` and optionally `QA_REPORT_PATH`. The fixture must contain a real generated `tool` opportunity. Pipeline QA additionally requires `QA_OPPORTUNITY_ID` and an administrator `QA_SESSION_COOKIE`; never run its evidence clear/restore checks on production.

## Remaining limitations

- No email ownership verification, password reset/change UI, OAuth, MFA, account deletion or session-management screen. The UI does not pretend to send verification email or offer functional provider login.
- HTTPS/reverse-proxy deployment, Secure cookies over TLS, multi-instance load, external security audit and public-service abuse resistance were not tested. APP_ORIGIN must be configured correctly. SQLite and process-local hash concurrency are intended for the current MVP. Global auth throttling can inconvenience unrelated users; expired auth/session rows have no scheduled cleanup.
- No first-user-admin shortcut or admin-management UI. A trusted operator must grant pipeline access explicitly. Existing source-management UI may show actions which regular users cannot execute; the server returns 403. Validation uses the shared provider and has no per-user billing/quota isolation.
- Match attributes are sparse and partly model-generated. There is no automatic enrichment; budget/time bracket assumptions are approximate. Feedback only affects that exact opportunity, not similar opportunities. Profile writes use last-write-wins across simultaneous tabs.
- Onboarding persists on Next/Back/Skip/Save, not on every unsaved selection. Legacy browser-local bookmarks/preferences are not imported. The explicit demo catalog and legacy demo pages remain labeled mock examples; billing, teams, notifications and integrations are not newly implemented.
- Existing pipeline limitations from PR #4 remain: AI may misjudge relevance; publication-host diversity is not proof of independent demand; Validation reports are not persisted and are not market-success probabilities. This pass reruns regression on previously ingested real records, not a new external ingestion/LLM campaign.
