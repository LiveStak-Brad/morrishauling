/**
 * Verify division schema + backfill, then set launch status to accepting_estimate_requests.
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
    if (i > 0 && !process.env[t.slice(0, i)]) process.env[t.slice(0, i)] = t.slice(i + 1);
  }
}

loadEnvLocal();

const projectRef = "wfdfyhrdqpozyavxxgob";
const password = process.env.SUPABASE_DB_PASSWORD;
const host = process.env.SUPABASE_POOLER_HOST ?? "aws-1-us-east-2.pooler.supabase.com";

const client = new pg.Client({
  host,
  port: 6543,
  user: `postgres.${projectRef}`,
  password,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  console.log("Connected");

  const checks = [
    "divisions",
    "material_categories",
    "notification_events",
  ];
  for (const table of checks) {
    const { rows } = await client.query(
      `select count(*)::int as n from information_schema.tables where table_schema='public' and table_name=$1`,
      [table]
    );
    console.log(`table ${table}: ${rows[0].n === 1 ? "OK" : "MISSING"}`);
  }

  for (const col of [
    ["jobs", "division_id"],
    ["estimates", "division_id"],
    ["invoices", "division_id"],
    ["schedule_slots", "division_id"],
    ["jobs", "completion_override_reason"],
    ["profiles", "division_access"],
    ["profiles", "managed_division_ids"],
  ]) {
    const { rows } = await client.query(
      `select count(*)::int as n from information_schema.columns where table_schema='public' and table_name=$1 and column_name=$2`,
      col
    );
    console.log(`column ${col[0]}.${col[1]}: ${rows[0].n === 1 ? "OK" : "MISSING"}`);
  }

  // Ensure divisions exist with correct logos + accepting_estimate_requests
  await client.query(`
    insert into public.divisions (id, company_id, name, short_name, service_type, launch_status, logo_path, config)
    values
      ('junk_removal', 'morris-hauling', 'Morris Junk Removal', 'Junk Removal', 'junk_removal', 'accepting_estimate_requests', '/logo.png', '{"pricing":"junk","workflow":"junk"}'::jsonb),
      ('hauling', 'morris-hauling', 'Morris Hauling', 'Hauling', 'hauling_transport', 'accepting_estimate_requests', '/haulinglogo.png', '{"pricing":"hauling","workflow":"hauling","safetyReview":true}'::jsonb)
    on conflict (id) do update set
      name = excluded.name,
      short_name = excluded.short_name,
      launch_status = 'accepting_estimate_requests',
      logo_path = excluded.logo_path,
      config = excluded.config,
      updated_at = now()
  `);

  // Backfill null divisions
  const backfillJobs = await client.query(`
    update public.jobs
    set division_id = case when service_type = 'hauling_transport' then 'hauling' else 'junk_removal' end
    where division_id is null
    returning id
  `);
  console.log(`backfilled jobs: ${backfillJobs.rowCount}`);

  const backfillEst = await client.query(`
    update public.estimates e
    set division_id = coalesce(
      (select j.division_id from public.jobs j where j.id = e.job_id),
      case when e.estimate_type = 'hauling_transport' then 'hauling' else 'junk_removal' end
    )
    where e.division_id is null
    returning id
  `);
  console.log(`backfilled estimates: ${backfillEst.rowCount}`);

  const backfillInv = await client.query(`
    update public.invoices i
    set division_id = coalesce(
      (select j.division_id from public.jobs j where j.id = i.job_id),
      'junk_removal'
    )
    where i.division_id is null
    returning id
  `);
  console.log(`backfilled invoices: ${backfillInv.rowCount}`);

  const backfillSlots = await client.query(`
    update public.schedule_slots
    set division_id = 'junk_removal'
    where division_id is null
    returning id
  `);
  console.log(`backfilled schedule_slots: ${backfillSlots.rowCount}`);

  const nullJobs = await client.query(`select count(*)::int as n from public.jobs where division_id is null`);
  console.log(`jobs with null division_id: ${nullJobs.rows[0].n}`);

  const { rows: divisions } = await client.query(
    `select id, name, launch_status, logo_path from public.divisions order by id`
  );
  console.log("divisions:", divisions);

  const { rows: mats } = await client.query(
    `select count(*)::int as n from public.material_categories where division_id='junk_removal'`
  );
  console.log(`junk material categories: ${mats[0].n}`);

  // Smoke write notification event
  const neId = `ne-verify-${Date.now()}`;
  await client.query(
    `insert into public.notification_events (id, company_id, division_id, event_type, channel, title, body, status)
     values ($1, 'morris-hauling', 'junk_removal', 'request_received', 'in_app', 'Verify', 'Division schema write OK', 'sent')
     on conflict (id) do nothing`,
    [neId]
  );
  console.log(`notification_events write: OK (${neId})`);

  await client.end();
  console.log("VERIFY_OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
