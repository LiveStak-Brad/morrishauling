/**
 * Discover Supabase pooler region and apply a migration file.
 * Usage: node scripts/apply-migration-pooler.mjs 003_auth_profiles_rls.sql
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const file = process.argv[2] ?? "003_auth_profiles_rls.sql";

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i > 0 && !process.env[t.slice(0, i)]) process.env[t.slice(0, i)] = t.slice(i + 1);
  }
}

loadEnvLocal();

const projectRef = "wfdfyhrdqpozyavxxgob";
const password = process.env.SUPABASE_DB_PASSWORD;
if (!password) {
  console.error("Missing SUPABASE_DB_PASSWORD");
  process.exit(1);
}

const sql = fs.readFileSync(path.join(root, "supabase", "migrations", file), "utf8");

const regions = [
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
  "ca-central-1",
  "eu-west-1",
  "eu-west-2",
  "eu-west-3",
  "eu-central-1",
  "eu-central-2",
  "eu-north-1",
  "ap-southeast-1",
  "ap-southeast-2",
  "ap-northeast-1",
  "ap-northeast-2",
  "ap-south-1",
  "sa-east-1",
];

for (const prefix of ["aws-0", "aws-1", "aws-2", "aws-3"]) {
  for (const region of regions) {
    for (const port of [5432, 6543]) {
      const host = `${prefix}-${region}.pooler.supabase.com`;
      const user = `postgres.${projectRef}`;
      const client = new pg.Client({
        host,
        port,
        user,
        password,
        database: "postgres",
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 8000,
      });
      try {
        await client.connect();
        console.log(`Connected: ${host}:${port}`);
        console.log(`Applying ${file}...`);
        await client.query(sql);
        await client.end();
        console.log("Migration applied successfully.");
        process.exit(0);
      } catch (err) {
        const msg = err.message ?? String(err);
        if (!msg.includes("ENOTFOUND") && !msg.includes("tenant/user")) {
          console.error(`Error on ${host}:${port}:`, msg);
        }
        try {
          await client.end();
        } catch {
          /* ignore */
        }
      }
    }
  }
}

console.error("Could not connect to any pooler region. Paste the SQL into Supabase SQL Editor.");
process.exit(1);
