import pg from "pg";

const PROJECT_REF = "wfdfyhrdqpozyavxxgob";
const POOLER_HOST = process.env.SUPABASE_POOLER_HOST ?? "aws-1-us-east-2.pooler.supabase.com";

export async function withPgClient<T>(fn: (client: pg.Client) => Promise<T>): Promise<T> {
  const password = process.env.SUPABASE_DB_PASSWORD;
  if (!password) throw new Error("SUPABASE_DB_PASSWORD not configured");

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

export async function upsertCustomerProfileViaPg(params: {
  userId: string;
  email: string;
  fullName: string;
  phone?: string;
  companyId: string;
}) {
  const customerId = `cust-${params.userId.slice(0, 8)}`;
  const [firstName, ...rest] = params.fullName.trim().split(/\s+/);
  const lastName = rest.join(" ") || "Customer";

  await withPgClient(async (client) => {
    await client.query(
      `
      insert into public.profiles (id, company_id, email, name, full_name, role, phone, status)
      values ($1, $2, $3, $4, $4, 'customer', $5, 'active')
      on conflict (id) do update set
        email = excluded.email,
        name = excluded.name,
        full_name = excluded.full_name,
        phone = excluded.phone,
        status = 'active'
      `,
      [params.userId, params.companyId, params.email, params.fullName, params.phone ?? null]
    );

    await client.query(
      `
      insert into public.customers (
        id, company_id, profile_id, first_name, last_name, email, phone, preferred_contact_method
      ) values ($1, $2, $3, $4, $5, $6, $7, 'email')
      on conflict (id) do update set
        profile_id = excluded.profile_id,
        email = excluded.email,
        phone = excluded.phone
      `,
      [
        customerId,
        params.companyId,
        params.userId,
        firstName,
        lastName,
        params.email,
        params.phone ?? null,
      ]
    );
  });

  return { customerId, profileId: params.userId };
}

export async function createAuthUserViaPg(params: {
  email: string;
  password: string;
  fullName: string;
}): Promise<{ userId: string; created: boolean }> {
  return withPgClient(async (client) => {
    const existing = await client.query(`select id from auth.users where email = $1 limit 1`, [
      params.email,
    ]);
    if (existing.rowCount && existing.rowCount > 0) {
      const userId = existing.rows[0].id as string;
      await client.query(
        `update auth.users set encrypted_password = crypt($2::text, gen_salt('bf')), email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now() where id = $1`,
        [userId, params.password]
      );
      if (params.fullName) {
        await client.query(
          `update auth.users set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('full_name', $2::text), updated_at = now() where id = $1`,
          [userId, params.fullName]
        );
      }
      await ensureAuthIdentityPg(client, userId, params.email);
      return { userId, created: false };
    }

    const { rows } = await client.query(
      `
      with new_user as (
        insert into auth.users (
          instance_id, id, aud, role, email, encrypted_password,
          email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
          confirmation_token, recovery_token, email_change_token_new, email_change
        ) values (
          '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
          $1::text, crypt($2::text, gen_salt('bf')), now(),
          '{"provider":"email","providers":["email"]}'::jsonb,
          jsonb_build_object('full_name', $3::text), now(), now(),
          '', '', '', ''
        ) returning id
      ),
      identity_insert as (
        insert into auth.identities (
          id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
        )
        select
          gen_random_uuid(), id,
          jsonb_build_object('sub', id::text, 'email', $1::text, 'email_verified', true),
          'email', id::text, now(), now(), now()
        from new_user
        returning user_id
      )
      select user_id from identity_insert
      `,
      [params.email, params.password, params.fullName]
    );
    return { userId: rows[0].user_id as string, created: true };
  });
}

async function ensureAuthIdentityPg(client: pg.Client, userId: string, email: string) {
  const existing = await client.query(
    `select 1 from auth.identities where user_id = $1 and provider = 'email' limit 1`,
    [userId]
  );
  if (existing.rowCount && existing.rowCount > 0) return;

  await client.query(
    `
    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), $1::uuid,
      jsonb_build_object('sub', $1::text, 'email', $2::text, 'email_verified', true),
      'email', $1::text, now(), now(), now()
    )
    `,
    [userId, email]
  );
}
