/**
 * Run a single migration file.
 * Usage: node scripts/run-migration.mjs 003_auth_profiles_rls.sql
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const file = process.argv[2];

if (!file) {
  console.error("Usage: node scripts/run-migration.mjs <filename.sql>");
  process.exit(1);
}

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
  "eu-central-1",
  "ap-southeast-1",
];

const attempts = [
  { host: `db.${projectRef}.supabase.co`, port: 5432, user: "postgres" },
  ...regions.flatMap((r) => [
    { host: `aws-0-${r}.pooler.supabase.com`, port: 6543, user: `postgres.${projectRef}` },
    { host: `aws-0-${r}.pooler.supabase.com`, port: 5432, user: `postgres.${projectRef}` },
  ]),
];

for (const attempt of attempts) {
  const client = new pg.Client({
    host: attempt.host,
    port: attempt.port,
    user: attempt.user,
    password,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });
  try {
    console.log(`Connecting ${attempt.host}:${attempt.port}...`);
    await client.connect();
    console.log(`Running ${file}...`);
    await client.query(sql);
    await client.end();
    console.log("Done.");
    process.exit(0);
  } catch (err) {
    console.warn(`Failed: ${err.message}`);
    try {
      await client.end();
    } catch {
      /* ignore */
    }
  }
}

console.error("Could not apply migration.");
process.exit(1);
