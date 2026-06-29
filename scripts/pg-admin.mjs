/**
 * Shared direct Postgres connection for setup scripts.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

export function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i > 0 && !process.env[t.slice(0, i)]) process.env[t.slice(0, i)] = t.slice(i + 1);
  }
}

const PROJECT_REF = "wfdfyhrdqpozyavxxgob";
const POOLER_HOST = process.env.SUPABASE_POOLER_HOST ?? "aws-1-us-east-2.pooler.supabase.com";

export async function withPgClient(fn) {
  loadEnvLocal();
  const password = process.env.SUPABASE_DB_PASSWORD;
  if (!password) throw new Error("Missing SUPABASE_DB_PASSWORD in .env.local");

  const client = new pg.Client({
    host: POOLER_HOST,
    port: Number(process.env.SUPABASE_POOLER_PORT ?? 5432),
    user: `postgres.${PROJECT_REF}`,
    password,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

export async function createAuthUserViaPg(client, { email, password, fullName }) {
  const existing = await client.query(`select id from auth.users where email = $1 limit 1`, [email]);
  if (existing.rowCount > 0) {
    const userId = existing.rows[0].id;
    if (password) {
      await client.query(
        `update auth.users set encrypted_password = crypt($2::text, gen_salt('bf')), email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now() where id = $1`,
        [userId, password]
      );
    }
    if (fullName) {
      await client.query(
        `update auth.users set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('full_name', $2::text), updated_at = now() where id = $1`,
        [userId, fullName]
      );
    }
    return { userId, created: false, passwordSynced: Boolean(password) };
  }

  const { rows } = await client.query(
    `
    with new_user as (
      insert into auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change
      ) values (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        $1::text,
        crypt($2::text, gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', $3::text),
        now(),
        now(),
        '',
        '',
        '',
        ''
      )
      returning id
    ),
    identity_insert as (
      insert into auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
      )
      select
        gen_random_uuid(),
        id,
        jsonb_build_object('sub', id::text, 'email', $1::text, 'email_verified', true),
        'email',
        id::text,
        now(),
        now(),
        now()
      from new_user
      returning user_id
    )
    select user_id from identity_insert
    `,
    [email, password, fullName]
  );

  return { userId: rows[0].user_id, created: true };
}
