# Netlify deployment: PR #5

Historical report for `d91d21c`: the SQLite guard and future-migration section below
describe that revision only. The current PostgreSQL schema, conditional runtime
guard, import and release procedure are documented in [POSTGRES-PRODUCTION.md](POSTGRES-PRODUCTION.md).

## Confirmed failure

Commit `74c6dcf00b0ce9f27a730ffca70db742989eafc4` failed in the adapter packaging stage, after Next.js compilation. The [failed deploy](https://app.netlify.com/projects/endearing-liger-4144f2/deploys/6ac06f583c329800086835ea) reports:

```
Usage of unsupported C++ Addon(s) found in Node.js Middleware:
/opt/build/repo/.next/standalone/generated/prisma/libquery_engine-rhel-openssl-3.0.x.so.node
```

`proxy.ts → lib/auth.ts → lib/db.ts → PrismaClient` put the native Prisma engine into the middleware dependency graph. Netlify's adapter supports Next.js Node Middleware but [does not support C++ addons there](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/#limitations). The failure was not an auth algorithm, Match Score, Windows-path or missing-API-key compilation error.

## Deployment-only changes

- Proxy imports only dependency-free cookie/origin/deployment helpers. Opaque-session resolution lives in `/api/auth/session`, explicitly a Node route. Proxy forwards only the session cookie to this same-app route, uses no-store, rejects redirects, and fails closed on timeout/error. The endpoint returns only authenticated/admin flags and never a token, password or profile. The route is excluded from recursive session lookup.
- The credentials/session model and personalization algorithm remain the same. Local real-account regression is rerun because the Proxy-to-Node boundary changed.
- `netlify.toml` explicitly builds with Node 24, `npm run netlify:build`, and publishes `.next`. The command generates Prisma Client before Next compilation. It does not run SQLite migrations or seed a disposable database in the Netlify build image.
- Netlify's public DEPLOY_PRIME_URL (fallback URL) is baked into a public FOUNDRY_DEPLOY_ORIGIN build constant because build env variables may be absent at function runtime. An explicitly configured APP_ORIGIN takes precedence. No secret is baked into this metadata. The callback host is never taken from arbitrary forwarding headers.
- FOUNDRY_PLATFORM is public build metadata indicating the Netlify target. This version's datasource is still local SQLite, so Netlify database routes/private pages fail closed with 503 and a configuration message. Landing/login/signup remain visible and disclose the limitation; submitting auth forms is disabled there. Even a session-shaped cookie on the landing page does not trigger a SQLite query. There is no in-memory account store, `/tmp` database, fake credential or pretend login fallback.

## Database and build/runtime boundary

The owner confirmed that no external database or production database environment variables exist. This pass does not provision a service, change the Prisma provider, or make a local SQLite file persistent through Netlify serverless invocations. A successful deploy preview verifies adapter packaging and public-page runtime; it does not mean database-backed accounts/pipeline are production-enabled.

Prisma generation is a build step and does not require opening the datasource. Database migration is a separate release operation against the actual persistent database. A SQLite file created during `prisma migrate deploy` in `/opt/build/repo` is neither the production account store nor a shared writable database for serverless Functions. The original local schema and all market/account data remain intact.

No production code contains an absolute Windows filesystem path. Local QA evidence documents historical paths and uses isolated database copies; those are not deployment configuration. Desktop FOUNDRY_AUDIT_BUILD/FOUNDRY_BUILD_THREADS flags are optional local QA modes and should not be set in Netlify settings.

## Environment variables

| Variable | Current requirement |
| --- | --- |
| APP_ORIGIN | Canonical public HTTPS origin outside localhost; optional on Netlify when its own deployment URL metadata is present. If explicitly set, use context-specific values for production and deploy-preview, so production origin does not reject preview requests. |
| DEPLOY_PRIME_URL / URL | Provided by Netlify at build; used for the public origin fallback. Do not enter fake values. |
| DATABASE_URL | Currently supports a local SQLite `file:` URL for local/VPS runtime only. It is not a way to connect this unchanged SQLite schema to PostgreSQL. |
| OPENROUTER_API_KEY | Required only for actual AI extraction/generation/validation with enough evidence. Not required to build public pages, resolve sessions, compute Match Score or display insufficient-evidence output. |
| FOUNDRY_PLATFORM / FOUNDRY_DEPLOY_ORIGIN | Derived public build constants; do not manually spoof them to bypass the missing-database guard. |

## Recommended future database migration (requires separate agreement)

Use a persistent managed PostgreSQL database with a preview database/branch isolated from production. Keep User/Profile/Saved/Feedback/session architecture unchanged; change only the Prisma provider, datasource wiring and SQL migration dialect. No provider has been selected or paid service created in this fix.

Planned env names: `DATABASE_URL` for runtime connection, and optionally `DIRECT_URL` for direct migration access when the runtime uses a pooler; `APP_ORIGIN` for canonical context-specific HTTPS URLs; `OPENROUTER_API_KEY` only for AI features. DIRECT_URL is a recommendation, not a variable consumed by this current revision. Configure database secrets in Netlify Functions scope and migrate from a trusted release job, not from ordinary PR previews against the production DB.

Create PostgreSQL migrations separately from the existing SQLite migration history. Import existing records while preserving IDs/foreign keys and evidence provenance, validate counts/traceability, then test registration and two-user isolation across separate Function invocations/redeploys. Only after that remove the explicit Netlify database-unavailable guard. Never put credentials in the repository or PR description.

## Verification scope

Run lint, typecheck, all unit tests, production build, and real local account/pipeline regressions. Check the middleware trace for absence of the native Prisma addon. Also build with Netlify metadata and verify public pages plus 503 responses with a deliberately unavailable SQLite path, proving that preview runtime does not depend on a Windows or build-machine database file. GitHub CI and the real Netlify adapter deployment provide Linux/native-engine generation and packaging verification.

Local results on this fix: lint/typecheck pass; all 20 tests pass; both ordinary and Netlify-targeted production builds pass. The 58 real account HTTP checks and 44 pipeline checks pass on the isolated copy through the new Proxy session lookup. Netlify-mode QA with an unavailable database path passes for all three public pages, and five database requests return the intended 503. The Netlify middleware trace contains no generated Prisma/native addon dependency. These checks preserve the common Opportunity Score 42 and distinct user Match Scores 100/0.
