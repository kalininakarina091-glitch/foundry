# PostgreSQL readiness and release procedure

Prepared from PR #5 / `d91d21c` on `feat/postgres-production`. Main is unchanged;
no production database, provider account, paid plan or external migration was
created. Code readiness and local PostgreSQL QA are verified. Permanent Netlify
PostgreSQL runtime remains unverified until the owner supplies a database and
completes the release checks below.

## Analysis and architecture

Application queries already used standard Prisma APIs: there were no SQLite raw
queries in account or market runtime. SQLite dependencies were the datasource,
SQL migration dialect, seed overwrite behavior, and temporary Netlify guard.
The importer is now the only active SQLite consumer. Historical QA docs describe
their original SQLite revisions; current QA scripts use HTTP and are provider
independent. No production module depends on a Windows path or local DB file.

The same eleven models now use PostgreSQL. String-encoded JSON stays TEXT,
passwords remain scrypt hashes, sessions remain hashed opaque tokens. IDs,
foreign keys, timestamps and existing attributes retain their meaning. Prisma
generates the baseline dialect. Archived SQLite SQL is never executed against
PostgreSQL. A populated unmanaged PostgreSQL schema is not a supported baseline
target: stop and plan reconciliation instead of resetting or marking it applied.

Cluster and Pattern are computed from Signal, not separate persisted models.
Their deterministic IDs and member IDs are retained in Opportunity.provenance.
The importer validates these identities against exact Signal/RawItem/Source
references, quotes and URLs. Existing legacy opportunities without provenance
are retained and reported, not promoted to supported evidence.

`lib/db.ts` shares one PrismaClient and pool per warm process, including production.
Runtime URL uses `connection_limit=2` and `pool_timeout=10` unless explicitly set.
These are per-process limits: use the provider's transaction pooler for serverless
concurrency and tune based on measured load and database plan. No client is
created per request and no disconnect occurs per request. Cold starts and pooler
compatibility/load have not been measured on a permanent hosted database.

Proxy still imports only pure origin/cookie/configuration helpers. It resolves
opaque sessions through the no-store `/api/auth/session` Node route. Prisma's
native engine remains outside middleware; ownership and admin checks, expiry,
throttle, origin checks and HttpOnly/SameSite/Secure behavior remain unchanged.
Opportunity Score, Validation Confidence and Match Score algorithms are unchanged.

## Build, migration and runtime separation

`npm run netlify:build` runs Prisma generate then Next build. It requires no DB
connection, does not migrate, seed or import, and never invents credentials.
`npm run db:validate`, `db:generate`, `db:migrate` and `db:setup` use the CLI wrapper.
For Prisma 6, the schema's directUrl env cannot be optional: the wrapper supplies
DIRECT_URL from DATABASE_URL when omitted. Raw Prisma CLI commands bypass that
fallback; use the npm commands. Runtime uses DATABASE_URL only; DIRECT_URL does
not need to be present in Functions. Missing/malformed/non-PostgreSQL DATABASE_URL
shows the configuration warning and returns 503 for DB routes. A configured URL
does not certify connectivity or completed migrations; DB errors still fail closed.

## Safe SQLite transfer

1. Stop writes to the SQLite application. Keep the original and make a consistent
   offline SQLite backup using SQLite backup tooling; ensure WAL is included.
   Store the backup and reports privately, outside the repository.
2. Choose an empty dedicated PostgreSQL database. Run `npm run db:setup` with its
   real DATABASE_URL and optional direct DIRECT_URL in private `.env.local` or
   process environment. The baseline creates eleven tables, indexes and FKs.
3. Inspect without writing: `npm run db:import -- --sqlite /private/snapshot.db
   --report /private/dry-run.json` (one command on one line).
4. Confirm the destination and keep target application traffic disabled. Set
   `FOUNDRY_IMPORT_CONFIRM=EMPTY_POSTGRES_TARGET`, then run:

   ```sh
   npm run db:import -- --sqlite /private/snapshot.db --apply --report /private/import.json
   ```

5. Require `transactionCommitted: true`, identical source/destination counts and
   `contentVerified: true`. Review traceable/legacy opportunity counts. Keep the
   SQLite backup and report for rollback; switch app configuration only after QA.

The source opens read-only with query_only and a consistent read transaction.
Integrity and FK checks, unknown-table rejection and explicit destination
confirmation precede writes. Import order is Source → RawItem → Signal →
Opportunity → Evidence → User → Profile → Session → Saved → Feedback → Throttle.
One PostgreSQL transaction, advisory lock and exclusive table locks prevent a
concurrent partial/repeated import. Every target application table must be empty.
Prisma migration history is not imported. Missing account tables in older SQLite
snapshots are accepted as empty. Unmapped tables fail closed.

Counts and sorted SHA-256 content digests verify every source column, including
JSON, IDs, dates, booleans, password hashes and token hashes, before commit.
Any insert/check failure rolls everything back. Re-running on populated targets
refuses to overwrite. This is an offline all-or-nothing importer, not incremental
replication. It loads the snapshot in memory and has a five-minute transaction
timeout; large datasets need a separately reviewed streaming transfer. Reports
contain counts/digests only; ORM errors are suppressed to avoid printing credentials
or row contents. Reports require a new destination and cannot overwrite any existing
file or the SQLite source. Never commit a DB, account QA handoff file or connection URL.

## Verified local results (2026-10-03)

Real disposable PostgreSQL 18.3 on loopback; no mocked database. Windows QA used
isolated binaries installed outside the repository. CI uses PostgreSQL 16.

| Table | Audited SQLite / imported PG | Original dev.db / imported PG |
| --- | ---: | ---: |
| Source | 8 / 8 | 5 / 5 |
| RawItem | 191 / 191 | 130 / 130 |
| Signal | 44 / 44 | 21 / 21 |
| Opportunity | 7 / 7 | 6 / 6 |
| Evidence | 83 / 83 | 81 / 81 |
| User | 6 / 6 | 0 / 0 |
| UserProfile | 6 / 6 | 0 / 0 |
| Session | 8 / 8 | 0 / 0 |
| SavedOpportunity | 3 / 3 | 0 / 0 |
| OpportunityFeedback | 1 / 1 | 0 / 0 |
| AuthThrottle | 9 / 9 | 0 / 0 |

Both transfers matched full content digests and references. Audited data contains
one traced and six legacy opportunities; original dev.db contains six legacy
opportunities. Source files retained identical whole-file SHA-256 checksums.
Repeated import refused without changing the target. An injected PostgreSQL
trigger failure at Evidence insertion rolled back every previously inserted table.

Prisma validate/generate/migrate pass. Lint/typecheck pass; all 25 unit tests pass.
Production build passes using Webpack. Local default Turbopack cannot traverse the
existing node_modules junction outside its root; this environment limitation is
not hidden by weakening checks. Linux GitHub CI verifies the default build.

58 account HTTP checks pass with two real PostgreSQL users: registration, login,
logout, invalid/tampered/expired sessions, previous-session rotation, CSRF,
six onboarding saves, settings, limited/skipped profile, ownership protection,
Saved/Feedback isolation and common catalog. Opportunity Score is 42 for both;
Match Score is 100 versus 0 with 20% attribute coverage. Personalization leaves
the catalog and market score unchanged. No DIRECT_URL is needed in runtime.

The Netlify-targeted build also passes without credentials. In local execution of
that build, all 58 account and 44 pipeline checks pass with PostgreSQL configured.
With configuration absent, three public pages show the warning and five database
requests return 503. Middleware build traces contain no Prisma/native addon.
Session, onboarding/profile, Settings preferences, Saved/Feedback, common catalog
and Match Score persist across process restart without a rebuild. These local
Netlify metadata checks do not certify a hosted persistent database.

44 pipeline HTTP checks pass against imported real market data: lineage and
derived IDs, normalize/extract/generate idempotency, invalid request rejection,
admin boundary, evidence clearing/restoration, Score reset/restoration and
Validation evidence snapshot. Recommendation remains RESEARCH MORE (two
materials from one publication host). This pass did not perform fresh paid AI
calls or claim a full positive BUILD validation; live ingestion/model behavior
was recorded in the earlier audit and remains subject to provider/network limits.

## Owner steps to enable permanent Netlify runtime

1. Create a managed PostgreSQL database yourself on a chosen plan. Neon is a
   suitable MVP option with pooling and a [Free plan](https://neon.com/blog/neon-free-plan-1-gb-per-project).
   Generic PostgreSQL, Supabase or Prisma Postgres also work with compatible TCP
   PostgreSQL URLs. No provider is selected or paid service activated by this PR.
2. Create separate production and preview databases/branches. Keep production
   credentials unavailable to untrusted previews. Obtain the real pooled URL for
   DATABASE_URL and direct/unpooled URL for DIRECT_URL; keep provider-required
   TLS options. [Neon's Prisma connection guidance](https://neon.com/blog/better-postgres-with-prisma-experience)
   describes its pooler support. No provider API token is required by Foundry.
3. Put these values in private local/release environment; run baseline and the
   read-only-inspect/confirmed-import procedure above. Do not use reset/db push.
   Do not run destructive account/pipeline QA on production data.
4. In Netlify project configuration → Environment variables, add DATABASE_URL
   separately for Production and Deploy Previews, available to Functions. If
   scope selection is unavailable on your plan, the default all scopes includes
   Functions. Do not place values in netlify.toml, NEXT_PUBLIC_* or next.config.env.
   [Netlify documents scopes and per-context values](https://docs.netlify.com/build/environment-variables/overview/).
   DIRECT_URL belongs in the trusted migration environment, not ordinary previews.
5. Set APP_ORIGIN to the exact production HTTPS origin. For previews leave it
   unset to use DEPLOY_PRIME_URL or set the exact preview origin for that context;
   do not copy the production origin into preview. Set OPENROUTER_API_KEY in
   Functions only if genuine AI extraction/generation/validation is required.
6. Deploy this branch/approved release and verify the preview on its isolated
   PostgreSQL: two accounts, session persistence across redeploys, onboarding,
   settings, Saved/Feedback, common market Score versus Match Score, evidence and
   Validation. Inspect function logs and DB connection load without exposing URLs.
7. Only after those checks consider production cutover. Keep SQLite backup and
   previous deployment for rollback. No main merge is performed by this task.

Remaining limits: permanent provider/TLS/pooler and multi-function/redeploy behavior
not yet verified; email verification/reset/OAuth/MFA absent; sparse Match attributes
remain explicitly unknown; legacy unsupported evidence remains legacy; AI and
ingestion limits remain unchanged; notifications/team/billing/integrations and demo
screens retain the prior explicitly marked mock behavior. No new product features.
