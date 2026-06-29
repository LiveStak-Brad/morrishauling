/**
 * Verify migration 003 via direct Postgres (pooler).
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
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i > 0) process.env[t.slice(0, i)] = t.slice(i + 1);
  }
}

loadEnvLocal();

const projectRef = "wfdfyhrdqpozyavxxgob";
const password = process.env.SUPABASE_DB_PASSWORD;
const client = new pg.Client({
  host: "aws-1-us-east-2.pooler.supabase.com",
  port: 5432,
  user: `postgres.${projectRef}`,
  password,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});

await client.connect();

const cols = await client.query(`
  select column_name from information_schema.columns
  where table_schema = 'public' and table_name = 'profiles'
  order by ordinal_position
`);
console.log("profiles columns:", cols.rows.map((r) => r.column_name).join(", "));

const policies = await client.query(`
  select tablename, policyname from pg_policies
  where schemaname = 'public' and policyname not like 'dev_%'
  order by tablename, policyname
  limit 20
`);
console.log("RLS policies (sample):", policies.rowCount);

const fns = await client.query(`
  select proname from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and proname in ('is_admin', 'my_customer_id', 'current_user_role')
`);
console.log("auth functions:", fns.rows.map((r) => r.proname).join(", "));

const profiles = await client.query(`select id, role, email, full_name, status from profiles limit 5`);
console.log("profiles count sample:", profiles.rowCount, profiles.rows);

await client.end();
