import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import dotenv from "dotenv";
import { PrismaClient } from "../generated/prisma/index.js";
import { tables, convertRow, fingerprint, checkReferences } from "./sqlite-import-data.mjs";
dotenv.config({ path: [".env.local", ".env"], quiet: true });

const args = process.argv.slice(2);
const option = name => args.includes(name) ? args[args.indexOf(name) + 1] : undefined;
const source = option("--sqlite"), reportFile = option("--report");
if (!source) throw new Error("Usage: npm run db:import -- --sqlite /path/to/snapshot.db [--apply --report /private/report.json]");
const apply = args.includes("--apply");
if (apply && process.env.FOUNDRY_IMPORT_CONFIRM !== "EMPTY_POSTGRES_TARGET")
  throw new Error("Set FOUNDRY_IMPORT_CONFIRM=EMPTY_POSTGRES_TARGET after checking the destination. No changes made.");
const sourcePath = path.resolve(source);
if (!fs.existsSync(sourcePath)) throw new Error("SQLite snapshot does not exist.");
// A report must never overwrite a database, existing file or symlink target.
// Exclusive creation below also protects against a race after this check.
if (reportFile && (path.resolve(reportFile) === sourcePath || fs.existsSync(reportFile)))
  throw new Error("Report destination already exists or is the source. Choose a new private report file. No changes made.");
const sqlite = new DatabaseSync(sourcePath, { readOnly: true });
let pg;
try {
  sqlite.exec("PRAGMA query_only=ON; BEGIN");
  assert.equal(sqlite.prepare("PRAGMA integrity_check").get().integrity_check, "ok", "SQLite integrity failure");
  assert.equal(sqlite.prepare("PRAGMA foreign_key_check").all().length, 0, "SQLite FK failure");
  const existing = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_prisma_migrations'").all().map(r => r.name);
  assert.ok(existing.every(t => tables.includes(t)), "Unmapped SQLite tables: extend importer before migrating");
  const data = Object.fromEntries(tables.map(t => [t, existing.includes(t) ? sqlite.prepare(`SELECT * FROM "${t}"`).all().map(convertRow) : []]));
  const traceability = checkReferences(data);
  const counts = Object.fromEntries(tables.map(t => [t, data[t].length]));
  const sourceFingerprints = Object.fromEntries(tables.map(t => [t, fingerprint(data[t])]));
  const report = { mode: apply ? "import" : "read-only inspection", counts, sourceFingerprints, ...traceability };
  if (apply) {
    const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
    assert.ok(url && ["postgres:", "postgresql:"].includes(new URL(url).protocol), "Provide a real PostgreSQL target URL");
    pg = new PrismaClient({ datasourceUrl: url });
    await pg.$transaction(async tx => {
      // Serializes concurrent importers. Lock all target tables against concurrent
      // writes: target must be offline and empty (except Prisma migration history).
      await tx.$executeRawUnsafe("SELECT pg_advisory_xact_lock(714320019)");
      await tx.$executeRawUnsafe(`LOCK TABLE ${tables.map(t => `"${t}"`).join(", ")} IN ACCESS EXCLUSIVE MODE`);
      for (const table of tables) assert.equal(await tx[table[0].toLowerCase() + table.slice(1)].count(), 0, `Destination ${table} is not empty; refusing to overwrite`);
      for (const table of tables) {
        const model = tx[table[0].toLowerCase() + table.slice(1)];
        for (let i = 0; i < data[table].length; i += 100)
          await model.createMany({ data: data[table].slice(i, i + 100) });
        const rows = await model.findMany();
        assert.equal(rows.length, counts[table], `Count mismatch: ${table}`);
        // Compare every source column, including IDs, JSON strings, password
        // hashes and session digests, without exposing those values in output.
        if (data[table].length) {
          const columns = Object.keys(data[table][0]);
          assert.equal(fingerprint(rows.map(r => Object.fromEntries(columns.map(c => [c, r[c]])))), sourceFingerprints[table], `Content mismatch: ${table}`);
        }
      }
      const imported = Object.fromEntries(await Promise.all(tables.map(async t => [t, await tx[t[0].toLowerCase() + t.slice(1)].findMany()])));
      assert.deepEqual(checkReferences(imported), traceability);
    }, { maxWait: 10000, timeout: 300000 });
    report.destinationCounts = counts;
    report.contentVerified = true;
    report.transactionCommitted = true;
  }
  if (reportFile) fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), { flag: "wx", mode: 0o600 });
  console.log(JSON.stringify(report, null, 2));
} catch (e) {
  // ORM errors can contain row data or connection details. Never print them.
  console.error(e?.code === "ERR_ASSERTION" ? `Import stopped: ${e.message.split("\n")[0]}` : "Import stopped: database/input operation failed. Check configuration and schema. No partial import is committed.");
  process.exitCode = 1;
} finally {
  try { sqlite.exec("ROLLBACK"); } catch { /* BEGIN may have failed. */ }
  sqlite.close();
  if (pg) await pg.$disconnect();
}
