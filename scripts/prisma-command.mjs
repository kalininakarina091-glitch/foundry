import { spawnSync } from "node:child_process";
import dotenv from "dotenv";
dotenv.config({ path: [".env.local", ".env"], quiet: true });
const args = process.argv.slice(2);
if (!args.length) throw new Error("Specify a Prisma command.");
// Prisma 6 directUrl has no schema-level optional fallback. Keep that choice
// in this CLI boundary; runtime continues to use DATABASE_URL only.
if (!process.env.DIRECT_URL && process.env.DATABASE_URL)
  process.env.DIRECT_URL = process.env.DATABASE_URL;
if (args[0] !== "generate" && !process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required. No database was changed.");
  process.exit(1);
}
const result = spawnSync(process.execPath, ["node_modules/prisma/build/index.js", ...args], {
  env: process.env, stdio: "inherit", shell: false,
});
if (result.error) { console.error("Prisma process could not start."); process.exit(1); }
process.exit(result.status ?? 1);
