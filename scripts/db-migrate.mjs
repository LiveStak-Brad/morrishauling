/**
 * Apply supabase/migrations/*.sql using direct Postgres connection.
 * Usage: node scripts/db-migrate.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

const projectRef = "wfdfyhrdqpozyavxxgob";
const password = process.env.SUPABASE_DB_PASSWORD;
const poolerHost = process.env.SUPABASE_POOLER_HOST ?? "aws-1-us-east-2.pooler.supabase.com";
if (!password) {
  console.error("Missing SUPABASE_DB_PASSWORD in .env.local");
  process.exit(1);
}

const encoded = encodeURIComponent(password);
const hosts = [
  poolerHost,
  `db.${projectRef}.supabase.co`,
  `aws-0-us-east-1.pooler.supabase.com`,
];

async function tryMigrate(host, port, user) {
  const client = new pg.Client({
    host,
    port,
    user,
    password,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });
  await client.connect();
  const migrationsDir = path.join(root, "supabase", "migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    console.log(`Running ${file}...`);
    await client.query(sql);
    console.log(`  ✓ ${file}`);
  }
  await client.end();
  return true;
}

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

async function main() {
  const attempts = [
    { host: hosts[0], port: 6543, user: `postgres.${projectRef}` },
    { host: hosts[0], port: 5432, user: `postgres.${projectRef}` },
    { host: `db.${projectRef}.supabase.co`, port: 5432, user: "postgres" },
    ...regions.flatMap((r) => [
      { host: `aws-0-${r}.pooler.supabase.com`, port: 6543, user: `postgres.${projectRef}` },
      { host: `aws-0-${r}.pooler.supabase.com`, port: 5432, user: `postgres.${projectRef}` },
      { host: `aws-1-${r}.pooler.supabase.com`, port: 6543, user: `postgres.${projectRef}` },
    ]),
  ];

  for (const attempt of attempts) {
    try {
      console.log(`Connecting to ${attempt.host}:${attempt.port}...`);
      await tryMigrate(attempt.host, attempt.port, attempt.user);
      console.log("\nMigration complete.");
      return;
    } catch (err) {
      console.warn(`  Failed: ${err.message}`);
    }
  }
  console.error("\nCould not connect. Run supabase/migrations/001_initial_schema.sql in the Supabase SQL Editor.");
  process.exit(1);
}

main();
