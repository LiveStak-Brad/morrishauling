import { readFileSync, existsSync } from "fs";
import pg from "pg";

const envPath = ".env.local";
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i > 0 && !process.env[t.slice(0, i)]) process.env[t.slice(0, i)] = t.slice(i + 1);
  }
}

const email = "bradmorrismma@gmail.com";
const client = new pg.Client({
  host: process.env.SUPABASE_POOLER_HOST ?? "aws-1-us-east-2.pooler.supabase.com",
  port: Number(process.env.SUPABASE_POOLER_PORT ?? 5432),
  user: "postgres.wfdfyhrdqpozyavxxgob",
  password: process.env.SUPABASE_DB_PASSWORD,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});
await client.connect();
const u = await client.query("select id, email from auth.users where email = $1", [email]);
console.log("auth.users:", u.rows);
if (u.rows[0]) {
  const userId = u.rows[0].id;
  const id = await client.query("select id, provider from auth.identities where user_id = $1", [userId]);
  console.log("auth.identities:", id.rows);
  const p = await client.query("select id, role, email from public.profiles where id = $1", [userId]);
  console.log("profiles:", p.rows);
  const e = await client.query(
    "select id, profile_id, email, lifecycle_status from public.employees where email = $1 or profile_id = $2",
    [email, userId]
  );
  console.log("employees:", e.rows);
}
await client.end();
