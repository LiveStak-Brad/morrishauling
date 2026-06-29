/**
 * Check auth.users for existing accounts.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const line of fs.readFileSync(path.join(root, ".env.local"), "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i > 0) process.env[t.slice(0, i)] = t.slice(i + 1);
}

const client = new pg.Client({
  host: "aws-1-us-east-2.pooler.supabase.com",
  port: 5432,
  user: "postgres.wfdfyhrdqpozyavxxgob",
  password: process.env.SUPABASE_DB_PASSWORD,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});
await client.connect();
const users = await client.query(
  `select id, email, email_confirmed_at is not null as confirmed from auth.users order by created_at desc limit 10`
);
console.log(users.rows);
await client.end();
